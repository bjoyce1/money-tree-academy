import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, Square, SkipBack, SkipForward, Volume2, Settings, Loader2 } from 'lucide-react';
import { useCharacterCompanion } from './CharacterCompanion';
import voiceService from '@/services/voiceService';

interface TextToSpeechPlayerProps {
  text: string;
  chapterTitle?: string;
  onSentenceChange?: (sentenceIndex: number | null, sentenceText: string | null) => void;
}

export default function TextToSpeechPlayer({ text, chapterTitle, onSentenceChange }: TextToSpeechPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isPlayingRef = useRef(false);
  const currentPosRef = useRef(0);
  const { getSelectedCharacter } = useCharacterCompanion();

  const cleanText = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const sentences = cleanText.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
  const totalSentences = sentences.length;

  useEffect(() => {
    return () => {
      voiceService.stopCurrent();
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
      onSentenceChange?.(null, null);
    };
  }, []);

  const speakSentence = useCallback(async (index: number) => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    voiceService.stopCurrent();

    if (index >= totalSentences) {
      setIsPlaying(false); setIsPaused(false); setIsLoading(false);
      setCurrentPosition(0); currentPosRef.current = 0; isPlayingRef.current = false;
      onSentenceChange?.(null, null);
      return;
    }

    const sentenceText = sentences[index].trim();
    setCurrentPosition(index); currentPosRef.current = index;
    setIsLoading(true);
    onSentenceChange?.(index, sentenceText);

    try {
      const character = getSelectedCharacter();
      const audioUrl = await voiceService.generateSentenceAudio(sentenceText, character?.id);

      if (!audioUrl) {
        // No TTS available at all
        setIsPlaying(false); setIsLoading(false); isPlayingRef.current = false;
        onSentenceChange?.(null, null);
        return;
      }

      const audio = new Audio(audioUrl);
      audio.volume = volume;
      audioRef.current = audio;

      audio.onplay = () => { setIsPlaying(true); setIsPaused(false); setIsLoading(false); isPlayingRef.current = true; };
      audio.onended = () => {
        const next = currentPosRef.current + 1;
        if (next < totalSentences && isPlayingRef.current) speakSentence(next);
        else { setIsPlaying(false); setIsPaused(false); setCurrentPosition(0); currentPosRef.current = 0; isPlayingRef.current = false; audioRef.current = null; onSentenceChange?.(null, null); }
      };
      audio.onerror = () => { setIsPlaying(false); setIsPaused(false); setIsLoading(false); isPlayingRef.current = false; audioRef.current = null; onSentenceChange?.(null, null); };
      await audio.play();
    } catch (err) {
      console.error('TTS error:', err);
      setIsPlaying(false); setIsLoading(false); isPlayingRef.current = false;
      onSentenceChange?.(null, null);
    }
  }, [sentences, totalSentences, volume, onSentenceChange, getSelectedCharacter]);

  const handlePlay = () => {
    if (isPaused && audioRef.current) {
      audioRef.current.play(); setIsPaused(false); setIsPlaying(true); isPlayingRef.current = true;
    } else {
      speakSentence(currentPosition);
    }
  };

  const handlePause = () => {
    if (audioRef.current) audioRef.current.pause();
    setIsPaused(true); setIsPlaying(false); isPlayingRef.current = false;
  };

  const handleStop = () => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    voiceService.stopCurrent();
    setIsPlaying(false); setIsPaused(false); setIsLoading(false); isPlayingRef.current = false;
    setCurrentPosition(0); currentPosRef.current = 0;
    onSentenceChange?.(null, null);
  };

  const handleSkipBack = () => { const p = Math.max(0, currentPosition - 1); setCurrentPosition(p); currentPosRef.current = p; if (isPlaying || isPaused) speakSentence(p); };
  const handleSkipForward = () => { const p = Math.min(totalSentences - 1, currentPosition + 1); setCurrentPosition(p); currentPosRef.current = p; if (isPlaying || isPaused) speakSentence(p); };

  useEffect(() => { if (audioRef.current) audioRef.current.volume = volume; }, [volume]);

  return (
    <div className="glass-card rounded-xl p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Volume2 className="text-primary" size={20} />
          <h3 className="font-bold text-foreground">Audio Narration</h3>
          {chapterTitle && <span className="text-sm text-muted-foreground">• {chapterTitle}</span>}
        </div>
        <button onClick={() => setShowSettings(!showSettings)} className="p-2 rounded-lg hover:bg-white/10 transition-colors" data-testid="button-tts-settings">
          <Settings className="text-muted-foreground" size={16} />
        </button>
      </div>

      <div className="flex items-center justify-center gap-4 mb-4">
        <button onClick={handleSkipBack} disabled={currentPosition === 0 || isLoading} className="p-2 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-30" data-testid="button-skip-back">
          <SkipBack className="text-foreground" size={20} />
        </button>
        <button onClick={isPlaying ? handlePause : handlePlay} disabled={isLoading} className="p-3 rounded-full bg-primary hover:bg-primary/90 transition-colors disabled:opacity-60" data-testid="button-play-pause" title={isPlaying ? 'Pause' : 'Play'}>
          {isLoading ? <Loader2 className="text-primary-foreground animate-spin" size={24} /> : isPlaying ? <Pause className="text-primary-foreground" size={24} /> : <Play className="text-primary-foreground ml-1" size={24} />}
        </button>
        <button onClick={handleStop} className="p-2 rounded-lg hover:bg-white/10 transition-colors" data-testid="button-stop">
          <Square className="text-foreground" size={20} />
        </button>
        <button onClick={handleSkipForward} disabled={currentPosition >= totalSentences - 1 || isLoading} className="p-2 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-30" data-testid="button-skip-forward">
          <SkipForward className="text-foreground" size={20} />
        </button>
      </div>

      <div className="mb-3">
        <div className="flex justify-between text-sm text-muted-foreground mb-1">
          <span>Position: {currentPosition + 1} / {totalSentences}</span>
          <span>{isLoading ? '⏳ Loading...' : isPlaying ? '🔊 Playing' : isPaused ? '⏸ Paused' : 'Stopped'}</span>
        </div>
        <div className="w-full bg-white/10 rounded-full h-2">
          <div className="bg-primary h-full rounded-full transition-all duration-300" style={{ width: `${((currentPosition + 1) / totalSentences) * 100}%` }} />
        </div>
      </div>

      {showSettings && (
        <div className="border-t border-white/10 pt-3 space-y-3">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Volume: {Math.round(volume * 100)}%</label>
            <input type="range" min="0" max="1" step="0.1" value={volume} onChange={(e) => setVolume(Number(e.target.value))} className="w-full accent-primary" data-testid="slider-volume" />
          </div>
        </div>
      )}

      <div className="text-xs text-muted-foreground mt-3 text-center">
        🎙️ AI-powered narration
      </div>
    </div>
  );
}
