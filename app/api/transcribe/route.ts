import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const assemblyApiKey = process.env.ASSEMBLYAI_API_KEY;
    
    if (!assemblyApiKey) {
      return NextResponse.json({ error: 'AssemblyAI API key not configured' }, { status: 500 });
    }

    // Log request details
    const contentType = request.headers.get('content-type');
    console.log('Request content type:', contentType);
    
    const audioArrayBuffer = await request.arrayBuffer();
    const audioBuffer = Buffer.from(audioArrayBuffer);
    
    console.log('Audio buffer size:', audioBuffer.length, 'bytes');
    console.log('Audio buffer type:', typeof audioBuffer);

    if (!audioBuffer || audioBuffer.length === 0) {
      return NextResponse.json({ error: 'No audio data provided' }, { status: 400 });
    }

    // Save a small sample of the audio for debugging
    if (audioBuffer.length > 100) {
      console.log('Audio sample (first 50 bytes):', audioBuffer.subarray(0, 50));
    }

    // Upload audio to AssemblyAI
    console.log('Uploading audio to AssemblyAI...');
    const uploadResponse = await fetch('https://api.assemblyai.com/v2/upload', {
      method: 'POST',
      headers: {
        'Authorization': assemblyApiKey,
        'Content-Type': contentType || 'audio/webm'
      },
      body: audioBuffer
    });

    console.log('Upload response status:', uploadResponse.status);
    
    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('Upload failed:', uploadResponse.status, errorText);
      return NextResponse.json({ 
        error: `Upload failed: ${uploadResponse.status}`,
        details: errorText
      }, { status: uploadResponse.status });
    }

    const uploadData = await uploadResponse.json();
    const audioUrl = uploadData.upload_url;
    
    console.log('Upload successful, audio URL:', audioUrl);

    // Start transcription
    console.log('Starting transcription...');
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

    console.log('Transcription response status:', transcriptResponse.status);
    
    if (!transcriptResponse.ok) {
      const errorText = await transcriptResponse.text();
      console.error('Transcription failed:', transcriptResponse.status, errorText);
      return NextResponse.json({ 
        error: `Transcription failed: ${transcriptResponse.status}`,
        details: errorText
      }, { status: transcriptResponse.status });
    }

    const transcriptData = await transcriptResponse.json();
    const transcriptId = transcriptData.id;

    let transcriptResult;
    let attempts = 0;
    const maxAttempts = 30;

    while (attempts < maxAttempts) {
      console.log(`Polling attempt ${attempts + 1}/${maxAttempts}...`);
      const pollResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
        headers: {
          'Authorization': assemblyApiKey,
        }
      });

      if (!pollResponse.ok) {
        const errorText = await pollResponse.text();
        console.error('Poll failed:', pollResponse.status, errorText);
        return NextResponse.json({ 
          error: `Poll failed: ${pollResponse.status}`,
          details: errorText
        }, { status: pollResponse.status });
      }

      transcriptResult = await pollResponse.json();
      console.log('Transcription status:', transcriptResult.status);

      if (transcriptResult.status === 'completed') {
        console.log('Transcription completed!');
        console.log('Transcript text:', transcriptResult.text);
        break;
      } else if (transcriptResult.status === 'error') {
        console.error('Transcription error:', transcriptResult.error);
        return NextResponse.json({ error: `Transcription error: ${transcriptResult.error}` }, { status: 500 });
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
    }

    if (transcriptResult.status !== 'completed') {
      return NextResponse.json({ error: 'Transcription timeout' }, { status: 500 });
    }

    return NextResponse.json({ 
      text: transcriptResult.text 
    });

  } catch (error) {
    console.error('Transcription error:', error);
    return NextResponse.json({ 
      error: 'Transcription failed',
      message: error.message
    }, { status: 500 });
  }
}