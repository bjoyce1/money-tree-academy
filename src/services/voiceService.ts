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
  private audioCache = new Map<string, string>(); // text hash -> blob URL

  private getCacheKey(characterId: string, text: string): string {
    return `${characterId}:${text.slice(0, 100)}`;
  }

  /**
   * Play character speech using ElevenLabs via edge function
   */
  async playCharacterSpeech(characterId: string, text: string): Promise<void> {
    this.stopCurrent();

    const cacheKey = this.getCacheKey(characterId, text);
    let audioUrl = this.audioCache.get(cacheKey);

    if (!audioUrl) {
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
        const err = await response.text();
        throw new Error(`TTS request failed: ${response.status} - ${err}`);
      }

      const blob = await response.blob();
      audioUrl = URL.createObjectURL(blob);
      this.audioCache.set(cacheKey, audioUrl);
    }

    const audio = new Audio(audioUrl);
    this.currentAudio = audio;
    this.isPlaying = true;

    return new Promise<void>((resolve, reject) => {
      this.resolveCallback = resolve;

      audio.onended = () => {
        this.isPlaying = false;
        this.currentAudio = null;
        this.resolveCallback = null;
        resolve();
      };

      audio.onerror = (e) => {
        this.isPlaying = false;
        this.currentAudio = null;
        this.resolveCallback = null;
        reject(new Error(`Audio playback error: ${e}`));
      };

      audio.play().catch((err) => {
        this.isPlaying = false;
        this.currentAudio = null;
        this.resolveCallback = null;
        reject(err);
      });
    });
  }

  /**
   * Generate audio for TTS player (returns blob URL for sentence-by-sentence playback)
   */
  async generateSentenceAudio(text: string, characterId?: string): Promise<string> {
    const charId = characterId || 'emma';
    const cacheKey = this.getCacheKey(charId, text);
    const cached = this.audioCache.get(cacheKey);
    if (cached) return cached;

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
        body: JSON.stringify({ text, characterId: charId }),
      }
    );

    if (!response.ok) {
      throw new Error(`TTS request failed: ${response.status}`);
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    this.audioCache.set(cacheKey, url);
    return url;
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

  getIsPlaying(): boolean {
    return this.isPlaying;
  }

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
