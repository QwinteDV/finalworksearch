import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function enhanceSearchQuery(query) {
  try {
    const completion = await groq.chat.completions.create({
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
    });

    return completion.choices[0]?.message?.content?.trim() || query;
  } catch (error) {
    console.error('Error enhancing search query:', error);
    return query;
  }
}