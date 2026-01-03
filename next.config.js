/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  env: {
    GROQ_API_KEY: process.env.GROQ_API_KEY,
    ASSEMBLYAI_API_KEY: process.env.ASSEMBLYAI_API_KEY,
  },
}

module.exports = nextConfig