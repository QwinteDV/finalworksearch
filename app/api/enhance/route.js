export async function POST(request) {
  try {
    const { message } = await request.json();
    
    if (!message) {
      return Response.json({ error: 'No message provided' }, { status: 400 });
    }

    const groqApiKey = process.env.GROQ_API_KEY;
    
    if (!groqApiKey) {
      return Response.json({ error: 'Groq API key not configured' }, { status: 500 });
    }

    const model = process.env.GROQ_MODEL || 'llama3-8b-8192';

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
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

    return Response.json({ 
      response: aiResponse,
      originalQuery: message
    });

  } catch (error) {
    console.error('Enhancement error:', error);
    return Response.json({ 
      error: error.message || 'AI response failed',
      details: error.toString()
    }, { status: 500 });
  }
}