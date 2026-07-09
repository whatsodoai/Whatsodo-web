'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, MicOff, RotateCcw, Volume2, User, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBusiness } from '@/contexts/business-context';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

type RecordingState = 'idle' | 'recording' | 'processing';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('whatsodo_token');
}

export default function VoiceAgentPage() {
  const { activeBusiness } = useBusiness();
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [volume, setVolume] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const trackVolume = useCallback((stream: MediaStream) => {
    const ctx = new AudioContext();
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    analyserRef.current = analyser;

    const data = new Uint8Array(analyser.frequencyBinCount);
    const tick = () => {
      analyser.getByteFrequencyData(data);
      const avg = data.reduce((a, b) => a + b, 0) / data.length;
      setVolume(Math.min(100, avg * 2));
      animFrameRef.current = requestAnimationFrame(tick);
    };
    animFrameRef.current = requestAnimationFrame(tick);
  }, []);

  const stopVolumeTracking = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    setVolume(0);
  }, []);

  const startRecording = useCallback(async () => {
    if (!activeBusiness) {
      setError('Please select a business first.');
      return;
    }
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg';
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stopVolumeTracking();
        stream.getTracks().forEach((t) => t.stop());
        setRecordingState('processing');

        const blob = new Blob(chunksRef.current, { type: mimeType });
        await sendAudio(blob, mimeType);
      };

      recorder.start();
      trackVolume(stream);
      setRecordingState('recording');
    } catch {
      setError('Microphone access denied. Please allow microphone permissions.');
      setRecordingState('idle');
    }
  }, [activeBusiness, trackVolume, stopVolumeTracking]);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
  }, []);

  const sendAudio = async (blob: Blob, mimeType: string) => {
    try {
      const extension = mimeType.includes('webm') ? 'webm' : 'ogg';
      const formData = new FormData();
      formData.append('audio', blob, `recording.${extension}`);
      formData.append('businessId', activeBusiness!._id);

      const currentHistory = messages.map((m) => ({ role: m.role, content: m.content }));
      formData.append('history', JSON.stringify(currentHistory));

      const token = getToken();
      const res = await fetch(`${BASE_URL}/voice/chat`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Voice processing failed');
      }

      const { transcript, reply } = json;

      setMessages((prev) => [
        ...prev,
        { role: 'user', content: transcript },
        { role: 'assistant', content: reply },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setRecordingState('idle');
    }
  };

  const handleMicClick = () => {
    if (recordingState === 'idle') startRecording();
    else if (recordingState === 'recording') stopRecording();
  };

  const clearConversation = () => {
    setMessages([]);
    setError(null);
  };

  const pulseScale = 1 + (volume / 100) * 0.4;

  return (
    <div className="flex flex-col h-full bg-[#f6f7fb]">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-200 bg-white flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Voice Agent</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Speak to your AI assistant — it will transcribe and reply as text
          </p>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearConversation}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors"
          >
            <RotateCcw size={14} />
            Clear
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-4 pb-32">
            <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center">
              <Volume2 className="w-8 h-8 text-green-500" />
            </div>
            <div>
              <p className="text-gray-700 font-semibold text-lg">Talk to your AI assistant</p>
              <p className="text-gray-400 text-sm mt-1">
                Press and hold the mic button, speak your question, then release.
              </p>
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={cn('flex items-start gap-3', msg.role === 'user' ? 'flex-row-reverse' : 'flex-row')}
          >
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                msg.role === 'user' ? 'bg-green-500' : 'bg-gray-800'
              )}
            >
              {msg.role === 'user' ? (
                <User size={14} className="text-white" />
              ) : (
                <Bot size={14} className="text-white" />
              )}
            </div>
            <div
              className={cn(
                'max-w-[70%] px-4 py-3 rounded-2xl text-sm leading-relaxed',
                msg.role === 'user'
                  ? 'bg-green-500 text-white rounded-tr-sm'
                  : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-tl-sm'
              )}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {recordingState === 'processing' && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center flex-shrink-0">
              <Bot size={14} className="text-white" />
            </div>
            <div className="bg-white border border-gray-100 shadow-sm px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error */}
      {error && (
        <div className="mx-6 mb-3 px-4 py-2.5 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl">
          {error}
        </div>
      )}

      {/* Mic control */}
      <div className="px-6 pb-8 pt-4 flex flex-col items-center gap-3 bg-white border-t border-gray-100">
        <div className="relative flex items-center justify-center">
          {/* Pulse rings when recording */}
          {recordingState === 'recording' && (
            <>
              <div
                className="absolute rounded-full bg-green-400/20 transition-transform duration-100"
                style={{
                  width: 96,
                  height: 96,
                  transform: `scale(${pulseScale})`,
                }}
              />
              <div
                className="absolute rounded-full bg-green-400/10 transition-transform duration-200"
                style={{
                  width: 120,
                  height: 120,
                  transform: `scale(${pulseScale})`,
                }}
              />
            </>
          )}

          <button
            onClick={handleMicClick}
            disabled={recordingState === 'processing'}
            className={cn(
              'relative z-10 w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg',
              recordingState === 'idle' && 'bg-green-500 hover:bg-green-600 hover:scale-105',
              recordingState === 'recording' && 'bg-red-500 hover:bg-red-600',
              recordingState === 'processing' && 'bg-gray-300 cursor-not-allowed'
            )}
          >
            {recordingState === 'recording' ? (
              <MicOff size={24} className="text-white" />
            ) : (
              <Mic size={24} className="text-white" />
            )}
          </button>
        </div>

        <p className="text-xs text-gray-400">
          {recordingState === 'idle' && 'Tap to start recording'}
          {recordingState === 'recording' && 'Recording… tap to stop'}
          {recordingState === 'processing' && 'Transcribing & thinking…'}
        </p>
      </div>
    </div>
  );
}
