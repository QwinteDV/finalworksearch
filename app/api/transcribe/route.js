// Server-side API proxy for AssemblyAI
export async function POST(request) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio');

    if (!audioFile) {
      return new Response('No audio file provided', { status: 400 });
    }

    // Upload to AssemblyAI
    const uploadResponse = await fetch('https://api.assemblyai.com/v2/upload', {
      method: 'POST',
      headers: {
        'Authorization': process.env.ASSEMBLYAI_API_KEY,
      },
      body: formData,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('AssemblyAI upload error:', errorText);
      return new Response('Upload failed', { status: uploadResponse.status });
    }

    const uploadResult = await uploadResponse.json();

    // Start transcription
    const transcriptResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
      method: 'POST',
      headers: {
        'Authorization': process.env.ASSEMBLYAI_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        audio_url: uploadResult.upload_url,
        language_code: 'nl',
      }),
    });

    if (!transcriptResponse.ok) {
      return new Response('Transcription failed', { status: transcriptResponse.status });
    }

    const transcriptResult = await transcriptResponse.json();

    // Wait for transcription to complete
    let finalResult = transcriptResult;
    let attempts = 0;
    const maxAttempts = 30;

    while (attempts < maxAttempts && finalResult.status !== 'completed') {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const statusResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${finalResult.id}`, {
        headers: {
          'Authorization': process.env.ASSEMBLYAI_API_KEY,
        },
      });

      if (statusResponse.ok) {
        finalResult = await statusResponse.json();
      }
      
      attempts++;
    }

    return new Response(JSON.stringify({
      text: finalResult.text || '',
      status: finalResult.status,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Transcription error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}