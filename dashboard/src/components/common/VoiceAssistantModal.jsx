import React from 'react';
import WeatherAIChatbot from './WeatherAIChatbot';
import { X } from 'lucide-react';

export default function VoiceAssistantModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-4xl bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 text-slate-400 hover:text-white bg-slate-900/80 hover:bg-slate-800 rounded-lg transition-colors border border-slate-700/50"
          title="Close Modal"
        >
          <X className="w-5 h-5" />
        </button>
        <WeatherAIChatbot />
      </div>
    </div>
  );
}