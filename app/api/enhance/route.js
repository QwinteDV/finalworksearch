// Server-side API proxy for Groq
export async function POST(request) {
  try {
    const { query } = await request.json();

    if (!query) {
      return new Response('No query provided', { status: 400 });
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: 'Je bent een zoekassistent voor een webshop met elektronica. Help de gebruiker door hun zoekopdracht te verbeteren en relevante zoektermen toe te voegen. Geef alleen de verbeterde zoekterm terug, geen extra uitleg.'
          },
          {
            role: 'user',
            content: `Verbeter deze zoekopdracht voor een webshop: "${query}"`
          }
        ],
        model: 'llama3-8b-8192',
        max_tokens: 50,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Groq API error:', errorText);
      return new Response('Groq API failed', { status: response.status });
    }

    const result = await response.json();
    const enhancedQuery = result.choices[0]?.message?.content?.trim() || query;

    return new Response(JSON.stringify({ 
      originalQuery: query,
      enhancedQuery: enhancedQuery 
    }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Enhancement error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}