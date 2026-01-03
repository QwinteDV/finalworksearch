# Product Zoek Machine

Een moderne product zoekmachine met AI-powered voice search en tekst zoeken.

## Features
- 🔍 Real-time tekst search
- 🎤 Voice search met AssemblyAI
- 🤖 AI-powered zoekverbetering met Groq
- 📱 Responsive design
- 🛍️ 12 test producten in verschillende categorieën

## Deployment op Vercel

1. **Push naar GitHub**
2. **Vercel Environment Variables:**
   ```
   GROQ_API_KEY=jouw_groq_key
   ASSEMBLY_API_KEY=jouw_assemblyai_key
   ```
3. **Deploy**

## Bestanden Structuur
```
├── app/
│   ├── page.js                 # Hoofdpagina met environment variables
│   ├── api/
│   │   ├── transcribe/route.js # AssemblyAI proxy
│   │   └── enhance/route.js    # Groq proxy
│   └── globals.css
├── lib/
│   └── products.js             # Product data
├── app.js                      # Main JavaScript logic
├── config.js                   # Client-side config
├── styles.css                  # Custom styles
└── next.config.js              # Next.js config
```

## Security
- API keys zijn alleen server-side beschikbaar
- Client-side code roept secure API endpoints aan
- Geen API keys in browser zichtbaar