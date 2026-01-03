# Product Zoek Machine

Een moderne web applicatie met AI-powered voice search en product zoeken.

## Features
- 🔍 Real-time tekst search in producten
- 🎤 Voice search met AssemblyAI transcriptie
- 📱 Responsive design met Tailwind CSS
- 🛍️ 12 test producten in verschillende categorieën

## Structuur
```
├── index.html          # Hoofdpagina
├── app.js             # Main JavaScript functionaliteit
├── styles.css         # Custom styles
├── api/
│   └── transcribe.js  # AssemblyAI transcriptie API
├── package.json       # Dependencies
└── README.md          # Deze file
```

## Vercel Deployment

1. **Push naar GitHub**
2. **Import in Vercel**
3. **Environment Variables toevoegen:**
   ```
   ASSEMBLYAI_API_KEY=jouw_assemblyai_api_key
   ```

## API Keys
- **AssemblyAI API Key**: Maak aan op [assemblyai.com](https://assemblyai.com)

## Gebruik
1. Open de deployed site
2. Typ in de search bar voor direct zoeken
3. Klik op de microfoon voor voice search (3 seconden opname)

## Browser Support
- Chrome/Edge (beste voice support)
- Firefox/Safari (basic functionaliteit)
- Microfoon toestemming vereist voor voice search