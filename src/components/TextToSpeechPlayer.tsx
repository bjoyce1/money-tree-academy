import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, Square, SkipBack, SkipForward, Volume2, Settings } from 'lucide-react';
import { useCharacterCompanion } from './CharacterCompanion';

interface TextToSpeechPlayerProps {
  text: string;
  chapterTitle?: string;
  onSentenceChange?: (sentenceIndex: number | null, sentenceText: string | null) => void;
}

export default function TextToSpeechPlayer({ text, chapterTitle, onSentenceChange }: TextToSpeechPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [rate, setRate] = useState(1);
  const [volume, setVolume] = useState(0.8);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isPlayingRef = useRef(false);
  const currentPosRef = useRef(0);
  const { getSelectedCharacter } = useCharacterCompanion();

  const cleanText = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const sentences = cleanText.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
  const totalSentences = sentences.length;

  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
      onSentenceChange?.(null, null);
    };
  }, []);

  const speakSentence = useCallback((index: number) => {
    window.speechSynthesis?.cancel();

    if (index >= totalSentences) {
      setIsPlaying(false);
      setIsPaused(false);
      setCurrentPosition(0);
      currentPosRef.current = 0;
      isPlayingRef.current = false;
      onSentenceChange?.(null, null);
      return;
    }

    const sentenceText = sentences[index].trim();
    const utterance = new SpeechSynthesisUtterance(sentenceText);

    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(v => v.lang.startsWith('en'));
    if (englishVoice) utterance.voice = englishVoice;

    utterance.rate = rate;
    utterance.volume = volume;
    utterance.pitch = 1.0;
    utteranceRef.current = utterance;

    utterance.onstart = () => {
      setIsPlaying(true);
      setIsPaused(false);
      isPlayingRef.current = true;
      setCurrentPosition(index);
      currentPosRef.current = index;
      onSentenceChange?.(index, sentenceText);
    };

    utterance.onend = () => {
      // Auto-advance to next sentence
      const nextPos = currentPosRef.current + 1;
      if (nextPos < totalSentences && isPlayingRef.current) {
        speakSentence(nextPos);
      } else {
        setIsPlaying(false);
        setIsPaused(false);
        setCurrentPosition(0);
        currentPosRef.current = 0;
        isPlayingRef.current = false;
        utteranceRef.current = null;
        onSentenceChange?.(null, null);
      }
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      setIsPaused(false);
      isPlayingRef.current = false;
      utteranceRef.current = null;
      onSentenceChange?.(null, null);
    };

    window.speechSynthesis.speak(utterance);
  }, [sentences, totalSentences, rate, volume, onSentenceChange]);

  const handlePlay = () => {
    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsPlaying(true);
      isPlayingRef.current = true;
    } else {
      speakSentence(currentPosition);
    }
  };

  const handlePause = () => {
    window.speechSynthesis.pause();
    setIsPaused(true);
    setIsPlaying(false);
    isPlayingRef.current = false;
  };

  const handleStop = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
    isPlayingRef.current = false;
    setCurrentPosition(0);
    currentPosRef.current = 0;
    onSentenceChange?.(null, null);
  };

  const handleSkipBack = () => {
    const newPos = Math.max(0, currentPosition - 1);
    setCurrentPosition(newPos);
    currentPosRef.current = newPos;
    if (isPlaying || isPaused) speakSentence(newPos);
  };

  const handleSkipForward = () => {
    const newPos = Math.min(totalSentences - 1, currentPosition + 1);
    setCurrentPosition(newPos);
    currentPosRef.current = newPos;
    if (isPlaying || isPaused) speakSentence(newPos);
  };

  return (
    <div className="glass-card rounded-xl p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Volume2 className="text-primary" size={20} />
          <h3 className="font-bold text-foreground">Audio Narration</h3>
          {chapterTitle && (
            <span className="text-sm text-muted-foreground">• {chapterTitle}</span>
          )}
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          data-testid="button-tts-settings"
        >
          <Settings className="text-muted-foreground" size={16} />
        </button>
      </div>

      <div className="flex items-center justify-center gap-4 mb-4">
        <button onClick={handleSkipBack} disabled={currentPosition === 0}
          className="p-2 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-30" data-testid="button-skip-back">
          <SkipBack className="text-foreground" size={20} />
        </button>

        <button onClick={isPlaying ? handlePause : handlePlay}
          className="p-3 rounded-full bg-primary hover:bg-primary/90 transition-colors" data-testid="button-play-pause"
          title={isPlaying ? 'Pause' : 'Play'}>
          {isPlaying ? <Pause className="text-primary-foreground" size={24} /> : <Play className="text-primary-foreground ml-1" size={24} />}
        </button>

        <button onClick={handleStop} className="p-2 rounded-lg hover:bg-white/10 transition-colors" data-testid="button-stop">
          <Square className="text-foreground" size={20} />
        </button>

        <button onClick={handleSkipForward} disabled={currentPosition >= totalSentences - 1}
          className="p-2 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-30" data-testid="button-skip-forward">
          <SkipForward className="text-foreground" size={20} />
        </button>
      </div>

      <div className="mb-3">
        <div className="flex justify-between text-sm text-muted-foreground mb-1">
          <span>Position: {currentPosition + 1} / {totalSentences}</span>
          <span>{isPlaying ? '🔊 Playing' : isPaused ? '⏸ Paused' : 'Stopped'}</span>
        </div>
        <div className="w-full bg-white/10 rounded-full h-2">
          <div className="bg-primary h-full rounded-full transition-all duration-300"
            style={{ width: `${((currentPosition + 1) / totalSentences) * 100}%` }} />
        </div>
      </div>

      {showSettings && (
        <div className="border-t border-white/10 pt-3 space-y-3">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Speed: {rate}x</label>
            <input type="range" min="0.5" max="2" step="0.1" value={rate}
              onChange={(e) => setRate(Number(e.target.value))} className="w-full accent-primary" data-testid="slider-speech-rate" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Volume: {Math.round(volume * 100)}%</label>
            <input type="range" min="0" max="1" step="0.1" value={volume}
              onChange={(e) => setVolume(Number(e.target.value))} className="w-full accent-primary" data-testid="slider-volume" />
          </div>
        </div>
      )}

      <div className="text-xs text-muted-foreground mt-3 text-center">
        🔊 Uses your browser's built-in voices. Click play to listen!
      </div>
    </div>
  );
}
