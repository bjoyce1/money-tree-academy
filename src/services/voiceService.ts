export interface VoiceOptions {
  characterId: string;
  text: string;
  rate?: number;
  pitch?: number;
  volume?: number;
}

// Browser TTS fallback settings
const CHARACTER_VOICE_PREFS: Record<string, { gender: string; pitch: number; rate: number }> = {
  liam: { gender: 'male', pitch: 1.0, rate: 0.95 },
  emma: { gender: 'female', pitch: 1.1, rate: 1.0 },
  mateo: { gender: 'male', pitch: 0.9, rate: 0.9 },
  aisha: { gender: 'female', pitch: 1.05, rate: 1.0 },
};

class VoiceService {
  private currentAudio: HTMLAudioElement | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isPlaying = false;
  private resolveCallback: (() => void) | null = null;
  private audioCache = new Map<string, string>();
  private useElevenLabs = true; // will flip to false on quota/auth errors

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
      // Quota or auth error → disable ElevenLabs for this session
      this.useElevenLabs = false;
      console.warn('ElevenLabs unavailable, falling back to browser voices');
      throw new Error('elevenlabs-unavailable');
    }

    const blob = await response.blob();
    return URL.createObjectURL(blob);
  }

  // ── Browser TTS fallback ──

  private pickBrowserVoice(characterId: string): SpeechSynthesisVoice | null {
    const voices = speechSynthesis.getVoices();
    if (!voices.length) return null;
    const prefs = CHARACTER_VOICE_PREFS[characterId] || { gender: 'female' };
    const english = voices.filter(v => v.lang.startsWith('en'));
    const hint = prefs.gender === 'female'
      ? (v: SpeechSynthesisVoice) => /female|woman|zira|samantha|karen|victoria|fiona/i.test(v.name)
      : (v: SpeechSynthesisVoice) => /male|man|david|daniel|james|george|aaron/i.test(v.name);
    return english.find(hint) || english[0] || voices[0];
  }

  private speakBrowser(text: string, characterId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const synth = window.speechSynthesis;
      if (!synth) { reject(new Error('No speech synthesis')); return; }
      synth.cancel();

      const prefs = CHARACTER_VOICE_PREFS[characterId] || { pitch: 1, rate: 1 };
      const utterance = new SpeechSynthesisUtterance(text);
      const voice = this.pickBrowserVoice(characterId);
      if (voice) utterance.voice = voice;
      utterance.pitch = prefs.pitch;
      utterance.rate = prefs.rate;
      utterance.volume = 0.9;
      this.currentUtterance = utterance;

      utterance.onend = () => { this.currentUtterance = null; resolve(); };
      utterance.onerror = (e) => {
        this.currentUtterance = null;
        if (e.error === 'canceled' || e.error === 'interrupted') resolve();
        else reject(new Error(e.error));
      };
      synth.speak(utterance);
    });
  }

  // ── Public API ──

  async playCharacterSpeech(characterId: string, text: string): Promise<void> {
    this.stopCurrent();
    this.isPlaying = true;

    try {
      if (this.useElevenLabs) {
        const cacheKey = this.getCacheKey(characterId, text);
        let url = this.audioCache.get(cacheKey);
        if (!url) {
          url = await this.fetchElevenLabs(text, characterId);
          this.audioCache.set(cacheKey, url);
        }
        const audio = new Audio(url);
        this.currentAudio = audio;
        await new Promise<void>((resolve, reject) => {
          this.resolveCallback = resolve;
          audio.onended = () => { this.cleanup(); resolve(); };
          audio.onerror = () => { this.cleanup(); reject(new Error('playback error')); };
          audio.play().catch(e => { this.cleanup(); reject(e); });
        });
        return;
      }
    } catch {
      // fall through to browser TTS
    }

    // Browser fallback
    try {
      await this.speakBrowser(text, characterId);
    } finally {
      this.cleanup();
    }
  }

  async generateSentenceAudio(text: string, characterId?: string): Promise<string | null> {
    const charId = characterId || 'emma';
    if (!this.useElevenLabs) return null; // signal caller to use browser TTS

    const cacheKey = this.getCacheKey(charId, text);
    const cached = this.audioCache.get(cacheKey);
    if (cached) return cached;

    try {
      const url = await this.fetchElevenLabs(text, charId);
      this.audioCache.set(cacheKey, url);
      return url;
    } catch {
      return null; // caller should fallback
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
    if (this.currentUtterance) {
      window.speechSynthesis?.cancel();
      this.currentUtterance = null;
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
