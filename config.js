// API Configuration
const API_CONFIG = {
    GROQ_API_KEY: window.ENV?.GROQ_API_KEY || 'your_groq_api_key_here',
    ASSEMBLYAI_API_KEY: window.ENV?.ASSEMBLYAI_API_KEY || 'your_assemblyai_api_key_here'
};

// TEST: Add your real API keys here for local development
// Remove this before deploying to Vercel
// API_CONFIG.GROQ_API_KEY = 'your_real_groq_key_here';
// API_CONFIG.ASSEMBLYAI_API_KEY = 'your_real_assemblyai_key_here';

console.log('API Keys configured:', {
    groq: API_CONFIG.GROQ_API_KEY !== 'your_groq_api_key_here',
    assemblyai: API_CONFIG.ASSEMBLYAI_API_KEY !== 'your_assemblyai_api_key_here'
});