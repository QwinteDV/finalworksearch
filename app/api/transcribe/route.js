export async function POST(request) {
  try {
    const assemblyApiKey = process.env.ASSEMBLYAI_API_KEY;
    
    if (!assemblyApiKey) {
      return Response.json({ error: 'AssemblyAI API key not configured' }, { status: 500 });
    }

    // Get the audio blob directly from request
    const audioArrayBuffer = await request.arrayBuffer();
    const audioBuffer = Buffer.from(audioArrayBuffer);

    if (!audioBuffer || audioBuffer.length === 0) {
      return Response.json({ error: 'No audio data provided' }, { status: 400 });
    }

    // Upload audio to AssemblyAI
    const uploadResponse = await fetch('https://api.assemblyai.com/v2/upload', {
      method: 'POST',
      headers: {
        'Authorization': assemblyApiKey,
        'Content-Type': 'audio/webm'
      },
      body: audioBuffer
    });

    if (!uploadResponse.ok) {
      console.error('Upload failed:', uploadResponse.status, await uploadResponse.text());
      return Response.json({ error: `Upload failed: ${uploadResponse.status}` }, { status: uploadResponse.status });
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
      console.error('Transcription failed:', transcriptResponse.status, await transcriptResponse.text());
      return Response.json({ error: `Transcription failed: ${transcriptResponse.status}` }, { status: transcriptResponse.status });
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
        console.error('Poll failed:', pollResponse.status, await pollResponse.text());
        return Response.json({ error: `Poll failed: ${pollResponse.status}` }, { status: pollResponse.status });
      }

      transcriptResult = await pollResponse.json();

      if (transcriptResult.status === 'completed') {
        break;
      } else if (transcriptResult.status === 'error') {
        console.error('Transcription error:', transcriptResult.error);
        return Response.json({ error: `Transcription error: ${transcriptResult.error}` }, { status: 500 });
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
    }

    if (transcriptResult.status !== 'completed') {
      return Response.json({ error: 'Transcription timeout' }, { status: 500 });
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