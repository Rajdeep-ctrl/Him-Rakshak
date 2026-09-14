import React, { useState } from 'react';

export default function VoiceModal({ isOpen, onClose }) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [userQuery, setUserQuery] = useState('Will it rain today?');
  const [gptResponse, setGptResponse] = useState(
    'The weather in New Delhi is currently partly cloudy with a temperature of 28 degrees Celsius. There is a low chance of rain today.'
  );

  if (!isOpen) return null;

  const handleStartTalking = () => {
    setIsSpeaking(true);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(gptResponse);
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-slate-900 border border-cyan-500/30 rounded-2xl p-8 text-center text-slate-100 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white text-lg font-bold"
        >
          ✕
        </button>

        {/* Pulsing Mic Circle */}
        <div className="relative my-6 flex items-center justify-center">
          {isSpeaking && (
            <div className="absolute w-24 h-24 rounded-full bg-cyan-400/30 animate-ping"></div>
          )}
          <div className="w-20 h-20 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center text-3xl shadow-lg shadow-cyan-500/30 relative z-10">
            🎙️
          </div>
        </div>

        <h3 className="text-xl font-bold tracking-wide">
          {isSpeaking ? 'WeatherGPT is speaking...' : 'WeatherGPT Voice Assistant'}
        </h3>

        {userQuery && (
          <p className="mt-3 text-xs uppercase tracking-wider text-slate-400">
            YOU ASKED: <span className="text-slate-200 lowercase font-medium">"{userQuery}"</span>
          </p>
        )}

        {gptResponse && (
          <div className="mt-5 bg-slate-800/80 border border-slate-700/60 rounded-xl p-4 text-sm text-slate-300 text-left flex gap-3">
            <span className="text-cyan-400 text-lg">🔊</span>
            <p>{gptResponse}</p>
          </div>
        )}

        <button
          onClick={handleStartTalking}
          className="mt-6 inline-flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold px-6 py-2.5 rounded-xl transition shadow-lg shadow-cyan-500/20"
        >
          🎙️ Start Talking
        </button>
      </div>
    </div>
  );
}