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
        const assemblyApiKey = process.env.ASSEMBLYAI_API_KEY;
        
        if (!assemblyApiKey) {
            console.error('AssemblyAI API key not configured. Check Vercel environment variables.');
            return res.status(500).json({ error: 'AssemblyAI API key not configured' });
        }

        console.log('AssemblyAI API key found, processing audio...');

        // Handle FormData parsing
        const contentTypeHeader = req.headers['content-type'];
        let audioBuffer;
        let contentType = 'audio/wav';

        if (contentTypeHeader && contentTypeHeader.includes('multipart/form-data')) {
            // Simple FormData parsing
            const chunks = [];
            let data = Buffer.alloc(0);
            
            req.on('data', chunk => data = Buffer.concat([data, chunk]));
            
            await new Promise((resolve, reject) => {
                req.on('end', resolve);
                req.on('error', reject);
            });

            // Find audio data in FormData
            const boundary = contentTypeHeader.split('boundary=')[1];
            const parts = data.toString('binary').split('--' + boundary);
            
            for (const part of parts) {
                if (part.includes('name="audio"')) {
                    const headerEnd = part.indexOf('\r\n\r\n');
                    if (headerEnd !== -1) {
                        const audioData = part.substring(headerEnd + 4);
                        audioBuffer = Buffer.from(audioData, 'binary');
                        break;
                    }
                }
            }
        } else {
            // Raw audio buffer
            const buffers = [];
            req.on('data', (chunk) => buffers.push(chunk));
            
            await new Promise((resolve, reject) => {
                req.on('end', resolve);
                req.on('error', reject);
            });
            
            audioBuffer = Buffer.concat(buffers);
            contentType = req.headers['content-type'] || 'audio/wav';
        }

        if (!audioBuffer || audioBuffer.length === 0) {
            console.error('No audio data provided');
            return res.status(400).json({ error: 'No audio data provided' });
        }

        console.log('Audio received, size:', audioBuffer.length, 'bytes');
        console.log('Content type:', contentType);

        // Check if it's a valid WAV file
        if (audioBuffer.length < 44 || audioBuffer.toString('ascii', 0, 4) !== 'RIFF') {
            console.error('Invalid WAV file format');
            return res.status(400).json({ error: 'Invalid audio format' });
        }

        // Upload audio to AssemblyAI
        console.log('Uploading to AssemblyAI...');
        const uploadResponse = await fetch('https://api.assemblyai.com/v2/upload', {
            method: 'POST',
            headers: {
                'Authorization': assemblyApiKey,
                'Content-Type': contentType
            },
            body: audioBuffer
        });

        if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text();
            console.error('Upload failed:', uploadResponse.status, errorText);
            return res.status(500).json({ error: `Upload failed: ${uploadResponse.status}`, details: errorText });
        }

        const uploadData = await uploadResponse.json();
        const audioUrl = uploadData.upload_url;

        console.log('Upload successful, starting transcription...');

        // Start transcription
        const transcriptResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
            method: 'POST',
            headers: {
                'Authorization': assemblyApiKey,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                audio_url: audioUrl,
                language_code: 'nl'
            })
        });

        if (!transcriptResponse.ok) {
            const errorText = await transcriptResponse.text();
            console.error('Transcription failed:', transcriptResponse.status, errorText);
            return res.status(500).json({ error: `Transcription failed: ${transcriptResponse.status}`, details: errorText });
        }

        const transcriptData = await transcriptResponse.json();
        const transcriptId = transcriptData.id;

        console.log('Transcription started, ID:', transcriptId);

        // Poll for completion with shorter timeout
        let transcriptResult;
        let attempts = 0;
        const maxAttempts = 20; // Reduced timeout

        while (attempts < maxAttempts) {
            const pollResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
                headers: {
                    'Authorization': assemblyApiKey,
                }
            });

            if (!pollResponse.ok) {
                console.error('Poll failed:', pollResponse.status);
                return res.status(500).json({ error: `Poll failed: ${pollResponse.status}` });
            }

            transcriptResult = await pollResponse.json();
            console.log(`Poll ${attempts + 1}/${maxAttempts}:`, transcriptResult.status);

            if (transcriptResult.status === 'completed') {
                console.log('Transcription completed:', transcriptResult.text);
                break;
            } else if (transcriptResult.status === 'error') {
                console.error('Transcription error:', transcriptResult.error);
                return res.status(500).json({ error: `Transcription error: ${transcriptResult.error}` });
            }

            await new Promise(resolve => setTimeout(resolve, 1000));
            attempts++;
        }

        if (!transcriptResult || transcriptResult.status !== 'completed') {
            console.error('Transcription timeout after', attempts, 'attempts');
            return res.status(500).json({ error: 'Transcription timeout' });
        }

        return res.status(200).json({ 
            text: transcriptResult.text 
        });

    } catch (error) {
        console.error('Transcription error:', error);
        return res.status(500).json({ 
            error: 'Transcription failed',
            message: error.message
        });
    }
};