export interface VoiceOptions {
  characterId: string;
  text: string;
  rate?: number;
  pitch?: number;
  volume?: number;
}

// Character voice preferences (mapped to browser voice selection heuristics)
const CHARACTER_VOICE_PREFS: Record<string, { gender: string; pitch: number; rate: number }> = {
  liam: { gender: 'male', pitch: 1.0, rate: 0.95 },
  emma: { gender: 'female', pitch: 1.1, rate: 1.0 },
  mateo: { gender: 'male', pitch: 0.9, rate: 0.9 },
  aisha: { gender: 'female', pitch: 1.05, rate: 1.0 },
};

class VoiceService {
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isPlaying = false;
  private resolveCallback: (() => void) | null = null;

  /**
   * Pick the best available browser voice for a character
   */
  private pickVoice(characterId: string): SpeechSynthesisVoice | null {
    const voices = speechSynthesis.getVoices();
    if (voices.length === 0) return null;

    const prefs = CHARACTER_VOICE_PREFS[characterId] || { gender: 'female', pitch: 1.0, rate: 1.0 };

    // Try to find an English voice matching the preferred gender
    const englishVoices = voices.filter(v => v.lang.startsWith('en'));
    const genderHint = prefs.gender === 'female'
      ? (v: SpeechSynthesisVoice) => /female|woman|zira|samantha|karen|victoria|fiona/i.test(v.name)
      : (v: SpeechSynthesisVoice) => /male|man|david|daniel|james|george|aaron/i.test(v.name);

    const matched = englishVoices.find(genderHint);
    if (matched) return matched;

    // Fallback: any English voice, or first available
    return englishVoices[0] || voices[0];
  }

  /**
   * Play character speech using the browser's SpeechSynthesis API
   */
  async playCharacterSpeech(characterId: string, text: string): Promise<void> {
    // Cancel any ongoing speech first
    this.stopCurrent();

    const synth = window.speechSynthesis;
    if (!synth) {
      throw new Error('Speech synthesis is not supported in this browser.');
    }

    // Ensure voices are loaded
    let voices = synth.getVoices();
    if (voices.length === 0) {
      await new Promise<void>(resolve => {
        synth.addEventListener('voiceschanged', () => resolve(), { once: true });
        setTimeout(resolve, 1000); // fallback timeout
      });
      voices = synth.getVoices();
    }

    const prefs = CHARACTER_VOICE_PREFS[characterId] || { gender: 'female', pitch: 1.0, rate: 1.0 };

    // Create utterance synchronously (important for mobile gesture context)
    const utterance = new SpeechSynthesisUtterance(text);
    const voice = this.pickVoice(characterId);
    if (voice) utterance.voice = voice;
    utterance.pitch = prefs.pitch;
    utterance.rate = prefs.rate;
    utterance.volume = 0.9;

    this.currentUtterance = utterance;
    this.isPlaying = true;

    return new Promise<void>((resolve, reject) => {
      this.resolveCallback = resolve;

      utterance.onend = () => {
        this.isPlaying = false;
        this.currentUtterance = null;
        this.resolveCallback = null;
        resolve();
      };

      utterance.onerror = (event) => {
        this.isPlaying = false;
        this.currentUtterance = null;
        this.resolveCallback = null;
        if (event.error === 'canceled' || event.error === 'interrupted') {
          resolve(); // expected when stopping
        } else {
          reject(new Error(`Speech error: ${event.error}`));
        }
      };

      synth.speak(utterance);
    });
  }

  /**
   * Stop current speech
   */
  stopCurrent(): void {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    this.isPlaying = false;
    if (this.resolveCallback) {
      this.resolveCallback();
      this.resolveCallback = null;
    }
    this.currentUtterance = null;
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  /** No-op kept for API compatibility */
  clearCache(): void {}
  getCharacterVoices(): Record<string, string> { return {}; }
}

export const voiceService = new VoiceService();
export default voiceService;
