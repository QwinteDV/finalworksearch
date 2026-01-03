import { AssemblyAI } from 'assemblyai';

const assemblyAI = new AssemblyAI({
  apiKey: process.env.ASSEMBLYAI_API_KEY,
});

export async function transcribeAudio(audioBlob) {
  try {
    const buffer = Buffer.from(await audioBlob.arrayBuffer());
    
    const transcript = await assemblyAI.transcripts.create({
      audio: buffer,
      language_code: 'nl',
      auto_highlights: false,
      sentiment_analysis: false,
    });

    return transcript.text || '';
  } catch (error) {
    console.error('Error transcribing audio:', error);
    throw new Error('Failed to transcribe audio');
  }
}

export function startRecording() {
  return new Promise((resolve, reject) => {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        const mediaRecorder = new MediaRecorder(stream);
        const chunks = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunks.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(chunks, { type: 'audio/webm' });
          stream.getTracks().forEach(track => track.stop());
          resolve({ mediaRecorder, audioBlob: Promise.resolve(audioBlob) });
        };

        resolve({ 
          mediaRecorder, 
          audioBlob: new Promise((resolve) => {
            mediaRecorder.onstop = () => {
              const audioBlob = new Blob(chunks, { type: 'audio/webm' });
              stream.getTracks().forEach(track => track.stop());
              resolve(audioBlob);
            };
          })
        });
      })
      .catch(reject);
  });
}