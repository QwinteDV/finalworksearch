module.exports = async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { query } = req.body;
        
        if (!query) {
            return res.status(400).json({ error: 'No query provided' });
        }

        const groqApiKey = process.env.GROQ_API_KEY;
        
        if (!groqApiKey) {
            console.error('Groq API key not configured');
            return res.status(500).json({ error: 'Groq API key not configured' });
        }

        console.log('Enhancing query:', query);

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
                        content: `Verbeter deze zoekopdracht voor een webshop: "${query}"`
                    }
                ],
                max_tokens: 50,
                temperature: 0.1,
            })
        });

        if (!response.ok) {
            console.error('Groq API error:', response.status);
            return res.status(500).json({ error: `Groq API error: ${response.status}` });
        }

        const data = await response.json();
        const enhancedQuery = data.choices[0]?.message?.content?.trim();

        console.log('Enhanced query:', enhancedQuery);

        return res.status(200).json({ 
            originalQuery: query,
            enhancedQuery: enhancedQuery || query
        });

    } catch (error) {
        console.error('Enhancement error:', error);
        return res.status(500).json({ 
            error: 'Enhancement failed',
            message: error.message
        });
    }
};