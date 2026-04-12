// Character voice mappings are now handled server-side for security

export interface VoiceOptions {
  characterId: string;
  text: string;
  stability?: number;
  similarityBoost?: number;
  style?: number;
  speakerBoost?: boolean;
}

interface SpeechRequest {
  characterId: string;
  text: string;
  resolve: () => void;
  reject: (error: any) => void;
}

class VoiceService {
  private audioCache = new Map<string, string>();
  private isPlaying = false;
  private currentAudio: HTMLAudioElement | null = null;
  private speechQueue: SpeechRequest[] = [];
  private isProcessingQueue = false;

  /**
   * Generate speech audio for a character via backend API
   */
  async generateSpeech(options: VoiceOptions): Promise<string> {
    const { characterId, text, stability = 0.5, similarityBoost = 0.8, style = 0.3, speakerBoost = true } = options;
    
    // Create cache key
    const cacheKey = `${characterId}_${text}`;
    
    // Return cached audio if available
    if (this.audioCache.has(cacheKey)) {
      return this.audioCache.get(cacheKey)!;
    }

    try {
      // Call backend API to generate speech
      const response = await fetch('/api/voice/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          characterId,
          text,
          stability,
          similarityBoost,
          style,
          speakerBoost
        }),
      });

      if (!response.ok) {
        let errorMessage = 'Unknown error';
        try {
          const errorData = await response.json();
          errorMessage = errorData.details || errorData.error || errorData.message || response.statusText;
        } catch (e) {
          errorMessage = response.statusText || `HTTP ${response.status}`;
        }
        throw new Error(`Voice generation failed: ${errorMessage}`);
      }

      // Convert response to blob and create URL
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      // Cache the audio URL
      this.audioCache.set(cacheKey, audioUrl);
      
      // Set up cleanup for memory management
      setTimeout(() => {
        this.revokeAudioUrl(cacheKey);
      }, 300000); // Cleanup after 5 minutes of inactivity
      
      return audioUrl;
    } catch (error) {
      // Log error in development only
      // Voice generation failed - error details handled by service
      throw error instanceof Error ? error : new Error(String(error));
    }
  }

  /**
   * Play character speech (queued to prevent overlap)
   */
  async playCharacterSpeech(characterId: string, text: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // Clear the existing queue and stop current audio to ensure single speech
      this.clearSpeechQueue();
      this.stopCurrent();

      // Add new speech request to queue
      const request: SpeechRequest = {
        characterId,
        text,
        resolve,
        reject
      };

      this.speechQueue = [request]; // Only keep the latest request
      this.processQueue();
    });
  }

  /**
   * Process the speech queue (only one speech at a time)
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.speechQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    try {
      const request = this.speechQueue.shift();
      if (!request) {
        this.isProcessingQueue = false;
        return;
      }

      const { characterId, text, resolve, reject } = request;

      // Stop any current audio before starting new one
      this.stopCurrent();

      const audioUrl = await this.generateSpeech({ characterId, text });
      
      // Create and configure audio
      this.currentAudio = new Audio(audioUrl);
      this.currentAudio.preload = 'auto';
      this.currentAudio.volume = 0.8; // Set reasonable volume
      this.isPlaying = true;

      // Set up event listeners
      this.currentAudio.addEventListener('ended', () => {
        this.isPlaying = false;
        this.currentAudio = null;
        this.isProcessingQueue = false;
        resolve();
        // Process next in queue if any
        this.processQueue();
      });

      this.currentAudio.addEventListener('error', (error) => {
        // Audio playback error
        this.isPlaying = false;
        this.currentAudio = null;
        this.isProcessingQueue = false;
        reject(new Error('Audio playback failed - please try again'));
        // Process next in queue if any
        this.processQueue();
      });

      // Add loadstart event to verify audio is loading
      this.currentAudio.addEventListener('loadstart', () => {
        // Audio loading started
      });

      // Play audio with user gesture handling
      try {
        await this.currentAudio.play();
      } catch (playError: any) {
        // Audio play failed
        
        // Handle common audio play issues
        if (playError.name === 'NotAllowedError') {
          throw new Error('Audio playback requires user interaction. Please try clicking the audio button.');
        } else if (playError.name === 'NotSupportedError') {
          throw new Error('Audio format not supported by this browser.');
        } else {
          throw new Error(`Audio playback failed: ${playError.message}`);
        }
      }
    } catch (error) {
      // Error playing character speech
      this.isPlaying = false;
      this.isProcessingQueue = false;
      
      // Find and reject the current request
      const request = this.speechQueue.find(r => r.characterId && r.text);
      if (request) {
        request.reject(error);
      }
      
      // Process next in queue if any
      this.processQueue();
    }
  }

  /**
   * Clear the speech queue
   */
  private clearSpeechQueue(): void {
    // Reject all pending requests
    this.speechQueue.forEach(request => {
      request.reject(new Error('Speech cancelled - new speech started'));
    });
    this.speechQueue = [];
  }

  /**
   * Stop current audio playback and clear queue
   */
  stopCurrent(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    this.isPlaying = false;
    this.isProcessingQueue = false;
    this.clearSpeechQueue();
  }

  /**
   * Check if audio is currently playing
   */
  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  /**
   * Clear audio cache
   */
  clearCache(): void {
    // Revoke blob URLs to free memory
    this.audioCache.forEach(url => {
      URL.revokeObjectURL(url);
    });
    this.audioCache.clear();
  }

  /**
   * Revoke a specific audio URL to prevent memory leaks
   */
  private revokeAudioUrl(cacheKey: string): void {
    const url = this.audioCache.get(cacheKey);
    if (url) {
      URL.revokeObjectURL(url);
      this.audioCache.delete(cacheKey);
    }
  }

  /**
   * Get available character voices (now handled server-side)
   */
  getCharacterVoices(): Record<string, string> {
    // Character voices are now managed server-side for security
    return {};
  }
}

// Export singleton instance
export const voiceService = new VoiceService();
export default voiceService;