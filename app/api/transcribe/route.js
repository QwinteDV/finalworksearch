export async function POST(request) {
  if (request.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const assemblyApiKey = process.env.ASSEMBLYAI_API_KEY;
    
    if (!assemblyApiKey) {
      return Response.json({ error: 'AssemblyAI API key not configured' }, { status: 500 });
    }

    // Parse form data to get the audio file
    const formData = await request.formData();
    const audioFile = formData.get('audio');
    
    if (!audioFile) {
      return Response.json({ error: 'No audio data provided' }, { status: 400 });
    }

    // Convert file to buffer
    const audioBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(audioBuffer);
    const contentType = audioFile.type || 'audio/webm';

    // Upload audio to AssemblyAI with correct content type
    const uploadResponse = await fetch('https://api.assemblyai.com/v2/upload', {
      method: 'POST',
      headers: {
        'Authorization': assemblyApiKey,
        'Content-Type': contentType || 'audio/webm'
      },
      body: buffer
    });

    if (!uploadResponse.ok) {
      throw new Error(`Upload failed: ${uploadResponse.status}`);
    }

    const uploadData = await uploadResponse.json();
    const audioUrl = uploadData.upload_url;

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
      throw new Error(`Transcription failed: ${transcriptResponse.status}`);
    }

    const transcriptData = await transcriptResponse.json();
    const transcriptId = transcriptData.id;

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
        throw new Error(`Poll failed: ${pollResponse.status}`);
      }

      transcriptResult = await pollResponse.json();

      if (transcriptResult.status === 'completed') {
        break;
      } else if (transcriptResult.status === 'error') {
        throw new Error(`Transcription error: ${transcriptResult.error}`);
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
    }

    if (transcriptResult.status !== 'completed') {
      throw new Error('Transcription timeout');
    }

    return Response.json({ 
      text: transcriptResult.text 
    });

  } catch (error) {
    console.error('Transcription error:', error);
    return Response.json({ 
      error: 'Transcription failed',
      message: error.message
    }, { status: 500 });
  }
}