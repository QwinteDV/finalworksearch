// API Configuration
const API_CONFIG = {
    GROQ_API_KEY: window.ENV?.GROQ_API_KEY || 'your_groq_api_key_here',
    ASSEMBLYAI_API_KEY: window.ENV?.ASSEMBLYAI_API_KEY || 'your_assemblyai_api_key_here'
};

// For local development, add your keys here
// For Vercel, set environment variables