import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, SkipBack, SkipForward, Volume2, Settings } from 'lucide-react';
import voiceService from '../services/voiceService';
import { useCharacterCompanion } from './CharacterCompanion';

interface TextToSpeechPlayerProps {
  text: string;
  chapterTitle?: string;
}

export default function TextToSpeechPlayer({ text, chapterTitle }: TextToSpeechPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [rate, setRate] = useState(1);
  const [volume, setVolume] = useState(0.8);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const textRef = useRef<string>('');
  const { getSelectedCharacter } = useCharacterCompanion();
  const selectedCharacter = getSelectedCharacter();

  // Clean text for speech (remove HTML tags and normalize)
  const cleanText = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  textRef.current = cleanText;

  // Split text into sentences for better control
  const sentences = cleanText.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const totalSentences = sentences.length;

  useEffect(() => {
    return () => {
      // Stop any playing audio and clean up
      voiceService.stopCurrent();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const speak = async (fromPosition = 0) => {
    // Stop any current audio
    voiceService.stopCurrent();
    if (audioRef.current) {
      audioRef.current.pause();
    }

    // Check if a character is selected
    if (!selectedCharacter || !selectedCharacter.id) {
      // No character selected for voice generation
      return;
    }

    const textToSpeak = sentences.slice(fromPosition).join('. ') + '.';
    
    try {
      setIsGeneratingAudio(true);
      setIsPlaying(true);
      setIsPaused(false);

      // Generate audio using ElevenLabs via the selected character's voice
      const audioUrl = await voiceService.generateSpeech({
        characterId: selectedCharacter.id,
        text: textToSpeak,
        stability: 0.5,
        similarityBoost: 0.8
      });

      setIsGeneratingAudio(false);

      // Create and configure audio element
      const audio = new Audio(audioUrl);
      audio.volume = volume;
      audio.playbackRate = rate;
      audioRef.current = audio;

      audio.onplay = () => {
        setIsPlaying(true);
        setIsPaused(false);
      };

      audio.onpause = () => {
        setIsPaused(true);
        setIsPlaying(false);
      };

      audio.onended = () => {
        setIsPlaying(false);
        setIsPaused(false);
        setCurrentPosition(0);
        audioRef.current = null;
      };

      audio.onerror = (event) => {
        // Audio playback error
        setIsPlaying(false);
        setIsPaused(false);
        setIsGeneratingAudio(false);
        audioRef.current = null;
      };

      // Start playing
      await audio.play();

    } catch (error) {
      // Don't log cancellation errors as they're expected behavior
      if (!(error as Error).message?.includes('Speech cancelled')) {
        // Error generating or playing speech - handled by voice service
      }
      setIsPlaying(false);
      setIsPaused(false);
      setIsGeneratingAudio(false);
    }
  };

  const handlePlay = async () => {
    if (isPaused && audioRef.current && audioRef.current.paused) {
      audioRef.current.play();
      setIsPaused(false);
      setIsPlaying(true);
    } else {
      await speak(currentPosition);
    }
  };

  const handlePause = () => {
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
      setIsPaused(true);
      setIsPlaying(false);
    }
  };

  const handleStop = () => {
    voiceService.stopCurrent();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentPosition(0);
  };

  const handleSkipBack = async () => {
    const newPosition = Math.max(0, currentPosition - 1);
    setCurrentPosition(newPosition);
    if (isPlaying) {
      await speak(newPosition);
    }
  };

  const handleSkipForward = async () => {
    const newPosition = Math.min(totalSentences - 1, currentPosition + 1);
    setCurrentPosition(newPosition);
    if (isPlaying) {
      await speak(newPosition);
    }
  };

  return (
    <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700 rounded-xl p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Volume2 className="text-brand" size={20} />
          <h3 className="font-semibold text-slate-100">Audio Narration</h3>
          {chapterTitle && (
            <span className="text-sm text-slate-400">• {chapterTitle}</span>
          )}
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
          data-testid="button-tts-settings"
        >
          <Settings className="text-slate-400" size={16} />
        </button>
      </div>

      {/* Main Controls */}
      <div className="flex items-center justify-center gap-4 mb-4">
        <button
          onClick={handleSkipBack}
          className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
          disabled={currentPosition === 0}
          data-testid="button-skip-back"
        >
          <SkipBack className="text-slate-300" size={20} />
        </button>

        <button
          onClick={isPlaying ? handlePause : handlePlay}
          disabled={isGeneratingAudio}
          className="p-3 rounded-full bg-brand hover:bg-brand/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          data-testid="button-play-pause"
          title={isGeneratingAudio ? 'Generating audio with ElevenLabs...' : isPlaying ? 'Pause' : 'Play'}
        >
          {isGeneratingAudio ? (
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-slate-900 border-t-transparent"></div>
          ) : isPlaying ? (
            <Pause className="text-slate-900" size={24} />
          ) : (
            <Play className="text-slate-900 ml-1" size={24} />
          )}
        </button>

        <button
          onClick={handleStop}
          className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
          data-testid="button-stop"
        >
          <Square className="text-slate-300" size={20} />
        </button>

        <button
          onClick={handleSkipForward}
          className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
          disabled={currentPosition >= totalSentences - 1}
          data-testid="button-skip-forward"
        >
          <SkipForward className="text-slate-300" size={20} />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex justify-between text-sm text-slate-400 mb-1">
          <span>Position: {currentPosition + 1} / {totalSentences}</span>
          <span>
            {isGeneratingAudio ? 'Generating Audio...' : 
             isPlaying ? 'Playing' : 
             isPaused ? 'Paused' : 'Stopped'}
          </span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-2">
          <div 
            className="progress-bar h-full rounded-full transition-all duration-300"
            style={{ width: `${((currentPosition + 1) / totalSentences) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="border-t border-slate-700 pt-3 space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Speech Speed: {rate}x
            </label>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
              className="w-full accent-brand"
              data-testid="slider-speech-rate"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Volume: {Math.round(volume * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-full accent-brand"
              data-testid="slider-volume"
            />
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="text-xs text-slate-500 mt-3 text-center">
        Listen to the chapter content read aloud. Use controls to pause, skip sections, or adjust settings.
      </div>
    </div>
  );
}