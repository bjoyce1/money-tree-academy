export interface VoiceOptions {
  characterId: string;
  text: string;
  rate?: number;
  pitch?: number;
  volume?: number;
}

class VoiceService {
  private currentAudio: HTMLAudioElement | null = null;
  private isPlaying = false;
  private resolveCallback: (() => void) | null = null;
  private audioCache = new Map<string, string>();
  private useElevenLabs = true; // will flip to false on quota/auth error

  private getCacheKey(characterId: string, text: string): string {
    return `${characterId}:${text.slice(0, 100)}`;
  }

  // ── ElevenLabs ──

  private async fetchElevenLabs(text: string, characterId: string): Promise<string> {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    const response = await fetch(
      `${supabaseUrl}/functions/v1/elevenlabs-tts`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({ text, characterId }),
      }
    );

    if (!response.ok) {
      this.useElevenLabs = false;
      console.warn('ElevenLabs unavailable, falling back to Google Cloud TTS');
      throw new Error('elevenlabs-unavailable');
    }

    const blob = await response.blob();
    return URL.createObjectURL(blob);
  }

  // ── Google Cloud TTS fallback ──

  private async fetchGoogleTTS(text: string, characterId: string): Promise<string> {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    const response = await fetch(
      `${supabaseUrl}/functions/v1/google-cloud-tts`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({ text, characterId }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      console.error('Google Cloud TTS error:', err);
      throw new Error('google-tts-unavailable');
    }

    const blob = await response.blob();
    return URL.createObjectURL(blob);
  }

  // ── Public API ──

  async playCharacterSpeech(characterId: string, text: string): Promise<void> {
    this.stopCurrent();
    this.isPlaying = true;

    try {
      const cacheKey = this.getCacheKey(characterId, text);
      let url = this.audioCache.get(cacheKey);

      if (!url) {
        try {
          if (this.useElevenLabs) {
            url = await this.fetchElevenLabs(text, characterId);
          } else {
            url = await this.fetchGoogleTTS(text, characterId);
          }
        } catch {
          // If ElevenLabs failed, try Google; if Google failed, give up
          if (this.useElevenLabs) {
            // already flipped in fetchElevenLabs
          }
          url = await this.fetchGoogleTTS(text, characterId);
        }
        if (url) this.audioCache.set(cacheKey, url);
      }

      const audio = new Audio(url);
      this.currentAudio = audio;
      await new Promise<void>((resolve, reject) => {
        this.resolveCallback = resolve;
        audio.onended = () => { this.cleanup(); resolve(); };
        audio.onerror = () => { this.cleanup(); reject(new Error('playback error')); };
        audio.play().catch(e => { this.cleanup(); reject(e); });
      });
    } catch (err) {
      console.error('Voice playback failed:', err);
      this.cleanup();
    }
  }

  async generateSentenceAudio(text: string, characterId?: string): Promise<string | null> {
    const charId = characterId || 'emma';
    const cacheKey = this.getCacheKey(charId, text);
    const cached = this.audioCache.get(cacheKey);
    if (cached) return cached;

    try {
      let url: string;
      if (this.useElevenLabs) {
        url = await this.fetchElevenLabs(text, charId);
      } else {
        url = await this.fetchGoogleTTS(text, charId);
      }
      this.audioCache.set(cacheKey, url);
      return url;
    } catch {
      // ElevenLabs failed, try Google
      if (!this.useElevenLabs) return null;
      try {
        const url = await this.fetchGoogleTTS(text, charId);
        this.audioCache.set(cacheKey, url);
        return url;
      } catch {
        return null;
      }
    }
  }

  private cleanup() {
    this.isPlaying = false;
    this.currentAudio = null;
    this.resolveCallback = null;
  }

  stopCurrent(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    this.isPlaying = false;
    if (this.resolveCallback) {
      this.resolveCallback();
      this.resolveCallback = null;
    }
  }

  getIsPlaying(): boolean { return this.isPlaying; }

  clearCache(): void {
    this.audioCache.forEach(url => URL.revokeObjectURL(url));
    this.audioCache.clear();
  }

  getCharacterVoices(): Record<string, string> {
    return {
      liam: 'Liam (Energetic Male)',
      emma: 'Sarah (Warm Female)',
      mateo: 'Daniel (Calm Male)',
      aisha: 'Laura (Friendly Female)',
    };
  }
}

export const voiceService = new VoiceService();
export default voiceService;
