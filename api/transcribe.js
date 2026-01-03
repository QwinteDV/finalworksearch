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
            console.error('AssemblyAI API key not configured');
            return res.status(500).json({ error: 'AssemblyAI API key not configured' });
        }

        // Convert request to buffer
        const buffers = [];
        
        req.on('data', (chunk) => {
            buffers.push(chunk);
        });
        
        await new Promise((resolve, reject) => {
            req.on('end', resolve);
            req.on('error', reject);
        });
        
        const audioBuffer = Buffer.concat(buffers);

        if (!audioBuffer || audioBuffer.length === 0) {
            console.error('No audio data provided');
            return res.status(400).json({ error: 'No audio data provided' });
        }

        // Log first few bytes to debug audio format
        const audioSample = audioBuffer.slice(0, 16);
        console.log('Audio received, size:', audioBuffer.length, 'bytes');
        console.log('Audio header:', Array.from(audioSample).map(b => b.toString(16).padStart(2, '0')).join(' '));

        // Get content type from request
        const contentType = req.headers['content-type'] || 'audio/webm';
        console.log('Content type:', contentType);

        // Upload audio to AssemblyAI
        const uploadResponse = await fetch('https://api.assemblyai.com/v2/upload', {
            method: 'POST',
            headers: {
                'Authorization': assemblyApiKey,
                'Content-Type': contentType
            },
            body: audioBuffer
        });

        if (!uploadResponse.ok) {
            console.error('Upload failed:', uploadResponse.status);
            return res.status(500).json({ error: `Upload failed: ${uploadResponse.status}` });
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
            console.error('Transcription failed:', transcriptResponse.status);
            return res.status(500).json({ error: `Transcription failed: ${transcriptResponse.status}` });
        }

        const transcriptData = await transcriptResponse.json();
        const transcriptId = transcriptData.id;

        console.log('Transcription started, ID:', transcriptId);

        // Poll for completion
        let transcriptResult;
        let attempts = 0;
        const maxAttempts = 30;

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

        if (transcriptResult.status !== 'completed') {
            console.error('Transcription timeout');
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