import './globals.css';

export default function Home() {
  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: `
            // Test API routes
            fetch('/api/test')
              .then(res => res.json())
              .then(data => console.log('API Test:', data))
              .catch(err => console.error('API Test failed:', err));
            
            // Test specific routes
            fetch('/api/transcribe', { method: 'POST', body: 'test' })
              .then(res => res.json())
              .then(data => console.log('Transcribe API:', data))
              .catch(err => console.error('Transcribe API failed:', err));
            
            fetch('/api/chat', { method: 'POST', body: JSON.stringify({message: 'test'}) })
              .then(res => res.json())
              .then(data => console.log('Chat API:', data))
              .catch(err => console.error('Chat API failed:', err));
            
            window.ENV = {
              GROQ_API_KEY: "${process.env.GROQ_API_KEY}",
              ASSEMBLYAI_API_KEY: "${process.env.ASSEMBLYAI_API_KEY}"
            };
            console.log('Vercel environment loaded:', !!window.ENV.GROQ_API_KEY && !!window.ENV.ASSEMBLYAI_API_KEY);
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

            <script src="/config.js"></script>
            <script src="/lib/products.js"></script>
            <script src="/app.js"></script>
        </body>
        </html>
      `}} />
    </>
  );
}