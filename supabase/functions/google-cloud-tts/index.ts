import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Map character IDs to Google Cloud TTS voice configs
const CHARACTER_VOICES: Record<string, { name: string; ssmlGender: string }> = {
  liam: { name: 'en-US-Journey-D', ssmlGender: 'MALE' },
  emma: { name: 'en-US-Journey-F', ssmlGender: 'FEMALE' },
  mateo: { name: 'en-US-Journey-D', ssmlGender: 'MALE' },
  aisha: { name: 'en-US-Journey-F', ssmlGender: 'FEMALE' },
};

const CHARACTER_SPEED: Record<string, number> = {
  liam: 1.0,
  emma: 1.0,
  mateo: 0.95,
  aisha: 1.0,
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const API_KEY = Deno.env.get('GOOGLE_CLOUD_TTS_API_KEY');
    if (!API_KEY) {
      throw new Error('GOOGLE_CLOUD_TTS_API_KEY is not configured');
    }

    const { text, characterId } = await req.json();

    if (!text || typeof text !== 'string') {
      return new Response(JSON.stringify({ error: 'text is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const voice = CHARACTER_VOICES[characterId] || CHARACTER_VOICES['emma'];
    const speed = CHARACTER_SPEED[characterId] || 1.0;

    const response = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: { text },
          voice: {
            languageCode: 'en-US',
            name: voice.name,
            ssmlGender: voice.ssmlGender,
          },
          audioConfig: {
            audioEncoding: 'MP3',
            speakingRate: speed,
            pitch: 0,
            volumeGainDb: 0,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Google TTS API error [${response.status}]:`, errorText);
      return new Response(
        JSON.stringify({ error: `Google TTS API error: ${response.status}`, detail: errorText }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    // Google returns base64-encoded audio in audioContent field
    const audioBytes = Uint8Array.from(atob(data.audioContent), c => c.charCodeAt(0));

    return new Response(audioBytes, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Google TTS error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
