import { products } from './lib/products.js';
import './globals.css';

// API Route handler for transcription
async function handleTranscribeRequest(request) {
  try {
    const assemblyApiKey = process.env.ASSEMBLYAI_API_KEY;
    
    if (!assemblyApiKey) {
      return new Response(JSON.stringify({ error: 'AssemblyAI API key not configured' }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const audioArrayBuffer = await request.arrayBuffer();
    const audioBuffer = Buffer.from(audioArrayBuffer);

    if (!audioBuffer || audioBuffer.length === 0) {
      return new Response(JSON.stringify({ error: 'No audio data provided' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const uploadResponse = await fetch('https://api.assemblyai.com/v2/upload', {
      method: 'POST',
      headers: {
        'Authorization': assemblyApiKey,
        'Content-Type': 'audio/webm'
      },
      body: audioBuffer
    });

    if (!uploadResponse.ok) {
      return new Response(JSON.stringify({ error: `Upload failed: ${uploadResponse.status}` }), { 
        status: uploadResponse.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const uploadData = await uploadResponse.json();
    const audioUrl = uploadData.upload_url;

    const transcriptResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
      method: 'POST',
      headers: {
        'Authorization': assemblyApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        audio_url: audioUrl,
        language_code: 'nl'
      })
    });

    if (!transcriptResponse.ok) {
      return new Response(JSON.stringify({ error: `Transcription failed: ${transcriptResponse.status}` }), { 
        status: transcriptResponse.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const transcriptData = await transcriptResponse.json();
    const transcriptId = transcriptData.id;

    let transcriptResult;
    let attempts = 0;
    const maxAttempts = 30;

    while (attempts < maxAttempts) {
      const pollResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
        headers: {
          'Authorization': assemblyApiKey,
        }
      });

      if (!pollResponse.ok) {
        return new Response(JSON.stringify({ error: `Poll failed: ${pollResponse.status}` }), { 
          status: pollResponse.status,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      transcriptResult = await pollResponse.json();

      if (transcriptResult.status === 'completed') {
        break;
      } else if (transcriptResult.status === 'error') {
        return new Response(JSON.stringify({ error: `Transcription error: ${transcriptResult.error}` }), { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
    }

    if (transcriptResult.status !== 'completed') {
      return new Response(JSON.stringify({ error: 'Transcription timeout' }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ 
      text: transcriptResult.text 
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Transcription error:', error);
    return new Response(JSON.stringify({ 
      error: 'Transcription failed',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// API Route handler for chat/enhancement
async function handleChatRequest(request) {
  try {
    const { message } = await request.json();
    
    if (!message) {
      return new Response(JSON.stringify({ error: 'No message provided' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const groqApiKey = process.env.GROQ_API_KEY;
    
    if (!groqApiKey) {
      return new Response(JSON.stringify({ error: 'Groq API key not configured' }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        messages: [
          {
            role: 'system',
            content: 'Je bent een zoekassistent voor een webshop met elektronica. Help de gebruiker door hun zoekopdracht te verbeteren en relevante zoektermen toe te voegen. Geef alleen de verbeterde zoekterm terug, geen extra uitleg.'
          },
          {
            role: 'user',
            content: `Verbeter deze zoekopdracht voor een webshop: "${message}"`
          }
        ],
        max_tokens: 50,
        temperature: 0.1
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Groq API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content.trim();

    return new Response(JSON.stringify({ 
      response: aiResponse 
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Enhancement error:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'AI response failed',
      details: error.toString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export default function Home() {
  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: `
            // Environment variables
            window.ENV = {
              GROQ_API_KEY: "${process.env.GROQ_API_KEY}",
              ASSEMBLYAI_API_KEY: "${process.env.ASSEMBLYAI_API_KEY}"
            };
            
            console.log('Environment loaded:', !!window.ENV.GROQ_API_KEY && !!window.ENV.ASSEMBLYAI_API_KEY);
            console.log('Groq key length:', window.ENV.GROQ_API_KEY?.length);
            console.log('AssemblyAI key length:', window.ENV.ASSEMBLYAI_API_KEY?.length);
            
            // Mock API routes in client
            window.API_ROUTES = {
              transcribe: async (audioBlob) => {
                const formData = new FormData();
                formData.append('audio', audioBlob, 'recording.webm');
                
                const response = await fetch('/api/transcribe', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'audio/webm;codecs=opus'
                  },
                  body: audioBlob
                });
                
                const responseText = await response.text();
                if (!response.ok) {
                  throw new Error(\`Transcription failed: \${responseText}\`);
                }
                
                return JSON.parse(responseText);
              },
              
              chat: async (message) => {
                const response = await fetch('/api/chat', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({ message })
                });
                
                if (!response.ok) {
                  throw new Error('AI response failed');
                }
                
                return response.json();
              }
            };
          `,
        }}
      />
      <div dangerouslySetInnerHTML={{ __html: `
        <!DOCTYPE html>
        <html lang="nl">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Product Zoek Machine</title>
            <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
            <link href="styles.css" rel="stylesheet">
        </head>
        <body class="min-h-screen bg-gray-50">
            <main class="container mx-auto px-4 py-8 max-w-6xl">
                <header class="text-center mb-12">
                    <h1 class="text-4xl font-bold text-gray-900 mb-4">
                        Product Zoek Machine
                    </h1>
                    <p class="text-lg text-gray-600 mb-8">
                        Zoek naar producten door te typen of met je stem
                    </p>
                    
                    <div class="mb-8">
                        <form id="searchForm" class="w-full max-w-2xl mx-auto">
                            <div class="relative">
                                <div class="flex items-center">
                                    <div class="relative flex-1">
                                        <input
                                            type="text"
                                            id="searchInput"
                                            placeholder="Zoek naar producten..."
                                            class="w-full px-4 py-3 pr-12 text-gray-900 bg-white border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
                                        />
                                        <div class="absolute right-3 top-1/2 transform -translate-y-1/2">
                                            <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                                            </svg>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        id="voiceButton"
                                        class="px-4 py-3 border-t border-r border-b rounded-r-lg transition-all duration-200 bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
                                    >
                                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path>
                                        </svg>
                                    </button>
                                </div>
                                <div id="listeningIndicator" class="hidden absolute -bottom-8 left-0 text-sm text-red-500">
                                    Luisteren naar je stem...
                                </div>
                            </div>
                        </form>
                    </div>

                    <div id="searchInfo" class="hidden text-gray-500 mb-4">
                        <span id="resultCount"></span> producten gevonden voor "<span id="currentQuery"></span>"
                    </div>
                </header>

                <main>
                    <div id="loadingIndicator" class="hidden text-center py-12">
                        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                        <p class="mt-2 text-gray-600">Bezig met zoeken...</p>
                    </div>

                    <div id="noResults" class="hidden text-center py-12">
                        <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <h3 class="text-lg font-medium text-gray-900 mb-2">Geen producten gevonden</h3>
                        <p class="text-gray-500">Probeer een andere zoekterm</p>
                    </div>

                    <div id="productsGrid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <!-- Products will be inserted here -->
                    </div>
                </main>
            </main>

            <script>
                // Products data embedded
                window.PRODUCTS = ${JSON.stringify(products)};
            </script>
            <script src="/config.js"></script>
            <script src="/app.js"></script>
        </body>
        </html>
      `}} />
    </>
  );
}