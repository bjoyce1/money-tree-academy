import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Map character IDs to ElevenLabs voice IDs
const CHARACTER_VOICES: Record<string, string> = {
  liam: 'TX3LPaxmHKxFdv7VOQHJ',    // Liam voice
  emma: 'EXAVITQu4vr4xnSDxMaL',     // Sarah (warm female)
  mateo: 'onwK4e9ZLuTAKqWW03F9',     // Daniel (calm male)
  aisha: 'vZzlAds9NzvLsFSWp0qk',     // Aisha (free voice)
};

const CHARACTER_SETTINGS: Record<string, { stability: number; similarity_boost: number; style: number; speed: number }> = {
  liam: { stability: 0.4, similarity_boost: 0.75, style: 0.4, speed: 1.0 },
  emma: { stability: 0.5, similarity_boost: 0.75, style: 0.3, speed: 1.0 },
  mateo: { stability: 0.6, similarity_boost: 0.7, style: 0.2, speed: 0.95 },
  aisha: { stability: 0.5, similarity_boost: 0.75, style: 0.35, speed: 1.0 },
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    if (!ELEVENLABS_API_KEY) {
      throw new Error('ELEVENLABS_API_KEY is not configured');
    }

    const { text, characterId } = await req.json();

    if (!text || typeof text !== 'string') {
      return new Response(JSON.stringify({ error: 'text is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const voiceId = CHARACTER_VOICES[characterId] || CHARACTER_VOICES['emma'];
    const settings = CHARACTER_SETTINGS[characterId] || CHARACTER_SETTINGS['emma'];

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_turbo_v2_5',
          voice_settings: {
            stability: settings.stability,
            similarity_boost: settings.similarity_boost,
            style: settings.style,
            use_speaker_boost: true,
            speed: settings.speed,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`ElevenLabs API error [${response.status}]:`, errorText);
      // Return structured error so client can fallback to browser TTS
      return new Response(
        JSON.stringify({ error: `ElevenLabs API error: ${response.status}`, detail: errorText }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const audioBuffer = await response.arrayBuffer();

    return new Response(audioBuffer, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('TTS error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
