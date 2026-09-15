// src/ai/components/VoiceButton.jsx
// Microphone button for voice-to-text input.
// Uses Web Speech API if available; falls back to demo mode.

import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';

const DEMO_QUERIES = [
  'Why is revenue declining?',
  'Which region is performing best?',
  'What are the biggest risks this quarter?',
  'How is customer engagement trending?',
  'Forecast next quarter revenue.',
];

let demoIdx = 0;

export default function VoiceButton({ onTranscript, disabled }) {
  const [state, setState] = useState('idle'); // idle | listening | processing
  const [supported, setSupported] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setSupported(!!SpeechRecognition);
  }, []);

  function startListening() {
    if (state !== 'idle') {
      stopListening();
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      // Real speech recognition
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => setState('listening');
      rec.onresult = (e) => {
        const transcript = e.results[0][0].transcript;
        setState('processing');
        setTimeout(() => {
          setState('idle');
          onTranscript && onTranscript(transcript);
        }, 400);
      };
      rec.onerror = () => {
        setState('idle');
        triggerDemo();
      };
      rec.onend = () => {
        if (state === 'listening') setState('idle');
      };

      recognitionRef.current = rec;
      rec.start();
    } else {
      // Demo mode
      setState('listening');
      setTimeout(() => {
        setState('processing');
        setTimeout(() => {
          setState('idle');
          triggerDemo();
        }, 600);
      }, 1500);
    }
  }

  function stopListening() {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setState('idle');
  }

  function triggerDemo() {
    const query = DEMO_QUERIES[demoIdx % DEMO_QUERIES.length];
    demoIdx++;
    onTranscript && onTranscript(query);
  }

  const isActive = state === 'listening' || state === 'processing';
  const title = state === 'listening'
    ? 'Click to stop listening'
    : state === 'processing'
    ? 'Processing...'
    : supported ? 'Click to speak' : 'Voice demo mode';

  return (
    <button
      onClick={startListening}
      disabled={disabled}
      title={title}
      style={{
        width: 36,
        height: 36,
        borderRadius: '50%',
        border: isActive
          ? '2px solid rgba(37,99,235,0.5)'
          : '1px solid var(--border)',
        background: isActive
          ? 'rgba(37,99,235,0.08)'
          : 'var(--bg-muted)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: disabled ? 'not-allowed' : 'pointer',
        position: 'relative',
        flexShrink: 0,
        transition: 'all 0.2s ease',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {/* Ripple animation when listening */}
      {state === 'listening' && (
        <span style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          background: 'rgba(37,99,235,0.15)',
          animation: 'ai-pulse 1.2s ease-in-out infinite',
        }} />
      )}
      {state === 'processing'
        ? <Loader2 style={{ width: 14, height: 14, color: '#2563EB', animation: 'spin 1s linear infinite' }} />
        : state === 'listening'
        ? <MicOff style={{ width: 14, height: 14, color: '#2563EB' }} />
        : <Mic style={{ width: 14, height: 14, color: 'var(--text-secondary)' }} />
      }
      {!supported && (
        <span style={{
          position: 'absolute',
          bottom: -1, right: -1,
          width: 8, height: 8,
          borderRadius: '50%',
          background: '#D97706',
          border: '1px solid var(--bg-card)',
        }} title="Demo mode — browser doesn't support speech" />
      )}
    </button>
  );
}
