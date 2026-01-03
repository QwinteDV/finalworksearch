// API Configuration
const API_CONFIG = {
    GROQ_API_KEY: window.ENV?.GROQ_API_KEY || 'your_groq_api_key_here',
    ASSEMBLYAI_API_KEY: window.ENV?.ASSEMBLYAI_API_KEY || 'your_assemblyai_api_key_here'
};

// Debug logging
console.log('Environment loaded:', !!window.ENV);
console.log('ENV object:', window.ENV);
console.log('AssemblyAI key from ENV:', window.ENV?.ASSEMBLYAI_API_KEY);
console.log('AssemblyAI key in config:', API_CONFIG.ASSEMBLYAI_API_KEY);
console.log('AssemblyAI key is placeholder:', API_CONFIG.ASSEMBLYAI_API_KEY === 'your_assemblyai_api_key_here');