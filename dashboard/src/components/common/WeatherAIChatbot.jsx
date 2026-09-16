import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Send, 
  Bot, 
  User, 
  CloudRain, 
  Sparkles, 
  Sun, 
  Wind, 
  Droplets, 
  Compass, 
  RotateCcw,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  ArrowUpRight
} from 'lucide-react';
import { getWeatherByPlace } from '../../services/api';

export default function WeatherAIChatbot({ onClose }) {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: "Hello! I'm your Weather Assistant. Speak or type your query about real-time weather and safety alerts.",
      timestamp: '10:00 AM',
      weatherCard: null,
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState(null);
  
  const chatEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // Initialize Speech Recognition (STT)
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
        handleSendMessage(transcript);
      };

      recognitionRef.current.onerror = () => setIsListening(false);
      recognitionRef.current.onend = () => setIsListening(false);
    }
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Voice output function using Web Speech API Synthesis
  const speakText = (id, text) => {
    if (!('speechSynthesis' in window)) return;

    // Stop speaking if clicking the same message again
    if (speakingMessageId === id) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
      return;
    }

    window.speechSynthesis.cancel(); // Stop any active speech
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onend = () => setSpeakingMessageId(null);
    utterance.onerror = () => setSpeakingMessageId(null);
    
    setSpeakingMessageId(id);
    window.speechSynthesis.speak(utterance);
  };

  const toggleVoiceListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in your browser.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const quickPrompts = [
    'How do I manage alerts?',
    'How do I report a hazard?',
    'How do I use the risk map?',
    'What can I do in this project?',
  ];

  const getWebsiteGuidance = (query) => {
    const lowerQuery = query.toLowerCase();

    if (lowerQuery.includes('report') || lowerQuery.includes('submit')) {
      return {
        text: 'To report a hazard, open Citizen Reports. Select the hazard type, enter the location and coordinates, describe the situation, optionally add photo or video evidence, then submit the report.',
        action: { label: 'Open Citizen Reports', path: '/reports' },
      };
    }
    if (lowerQuery.includes('map') || lowerQuery.includes('gis') || lowerQuery.includes('risk zone')) {
      return {
        text: 'Open the GIS Risk Map to search by district, state, or location. Use the risk filter to show Critical, High, Medium, or Low areas, then select a marker to inspect rainfall, slope, soil, and weather details.',
        action: { label: 'Open GIS Risk Map', path: '/risk-map' },
      };
    }
    if (lowerQuery.includes('alert') || lowerQuery.includes('notification') || lowerQuery.includes('bell')) {
      return {
        text: 'Use the notification bell in the top bar for a quick unread-alert view. For full alert management, open Alerts: filter by severity, inspect an alert, acknowledge it, resolve it, or broadcast an emergency notification to configured contacts.',
        action: { label: 'Open Alert Management', path: '/alerts' },
      };
    }
    if (lowerQuery.includes('road') || lowerQuery.includes('highway')) {
      return {
        text: 'Open Road Monitoring to view corridor status, risk level, condition, and the latest update. Search by state, road name, or corridor to find a specific route.',
        action: { label: 'Open Road Monitoring', path: '/roads' },
      };
    }
    if (lowerQuery.includes('analytic') || lowerQuery.includes('predict') || lowerQuery.includes('trend')) {
      return {
        text: 'Open Predictive Analytics to compare Critical, High, Medium, and Low risk totals by state and review regional proportions and rainfall trends from the API dataset.',
        action: { label: 'Open Predictive Analytics', path: '/analytics' },
      };
    }
    if (lowerQuery.includes('setting') || lowerQuery.includes('language') || lowerQuery.includes('hindi') || lowerQuery.includes('assam')) {
      return {
        text: 'Open Settings to switch the interface language between English, Hindi, and Assamese, manage display preferences, and review system options. Your language selection is saved automatically.',
        action: { label: 'Open Settings', path: '/settings' },
      };
    }
    if (lowerQuery.includes('live') || lowerQuery.includes('mock') || lowerQuery.includes('data mode')) {
      return {
        text: 'Use the Live API and Mock buttons in the top bar. Live API loads backend and external weather data; Mock uses local demonstration data for testing the interface.',
        action: { label: 'Open Dashboard', path: '/dashboard' },
      };
    }
    if (lowerQuery.includes('contact') || lowerQuery.includes('helpline') || lowerQuery.includes('emergency number') || lowerQuery.includes('phone number')) {
      return {
        text: 'Open Contact Us for North Eastern Region disaster-management helplines. Use 112 for immediate emergencies, 1078 for the national disaster helpline, 1070 for state emergency coordination, 1077 for district control rooms, or the NDRF control room for rescue support.',
        action: { label: 'Open Contact Us', path: '/contact' },
      };
    }
    if (lowerQuery.includes('dashboard') || lowerQuery.includes('home') || lowerQuery.includes('overview')) {
      return {
        text: 'The Dashboard is your regional overview. It shows current risk totals, critical locations, rainfall, vulnerable roads, and the latest alert feed. Select a metric to inspect the related details.',
        action: { label: 'Open Dashboard', path: '/dashboard' },
      };
    }
    if (lowerQuery.includes('weather') || lowerQuery.includes('forecast') || lowerQuery.includes('rain')) {
      return {
        text: 'Ask me for the weather in any place, such as “weather in Shillong” or “will it rain near Guwahati?”. I will fetch live conditions, temperature, rainfall probability, humidity, wind, and UV information.',
      };
    }
    if (lowerQuery.includes('what can you') || lowerQuery.includes('help') || lowerQuery.includes('website') || lowerQuery.includes('project') || lowerQuery.includes('feature')) {
      return {
        text: 'I can guide you through every project area: Dashboard overview, GIS Risk Map, Alert Management, Road Monitoring, Citizen Reports, Predictive Analytics, Settings, language selection, Live API or Mock mode, and live weather lookups. Ask “How do I manage alerts?” or name any feature.',
      };
    }

    return null;
  };

  const handleSendMessage = async (textToSend) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const guidance = getWebsiteGuidance(query);
      if (guidance) {
        const botResponse = {
          id: Date.now() + 1,
          sender: 'bot',
          text: guidance.text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          weatherCard: null,
          action: guidance.action,
        };
        setMessages((prev) => [...prev, botResponse]);
        setIsTyping(false);
        speakText(botResponse.id, botResponse.text);
        return;
      }

      const placeMatch = query.match(/\b(?:in|at|for|near|of)\s+(.+?)(?:\s+(?:today|tomorrow|now|currently|this evening|tonight))?\s*[?!.]*$/i);
      const place = placeMatch?.[1] || query
        .replace(/\b(what is|what's|how is|how's|tell me|show|give me|the|current|live|weather|temperature|forecast|today|now|rain|raining|wind|humidity|uv index|safe|to drive|in|at|for|near)\b/gi, ' ')
        .replace(/[?!.]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      const weather = await getWeatherByPlace(place);
      const botResponse = {
        id: Date.now() + 1,
        sender: 'bot',
        text: `Live weather for ${weather.location}: ${weather.condition}, ${weather.temperature}°C. Rainfall today is ${weather.dailyRainfall} mm with a ${weather.precipitationProbability}% chance of precipitation.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        weatherCard: {
          location: weather.location,
          temp: `${weather.temperature}°C`,
          condition: weather.condition,
          humidity: `${weather.humidity}%`,
          wind: `${weather.windSpeed} km/h`,
          uv: `${weather.uvIndex}`,
        },
      };

      setMessages((prev) => [...prev, botResponse]);
      setIsTyping(false);

      // Automatically speak the response aloud
      speakText(botResponse.id, botResponse.text);
    } catch (error) {
      const botResponse = {
        id: Date.now() + 1,
        sender: 'bot',
        text: error.message || 'Live weather data is temporarily unavailable.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        weatherCard: null,
      };
      setMessages((prev) => [...prev, botResponse]);
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-screen max-h-[850px] w-full max-w-4xl mx-auto bg-white text-slate-800 rounded-2xl border border-slate-200 shadow-lg overflow-hidden font-sans">
      
      {/* Top Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-600">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              Atmosphere Voice Assistant
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Voice Activated
              </span>
            </h1>
            <p className="text-xs text-slate-500">Real-time Weather & Environmental Intelligence</p>
          </div>
        </div>
        <button
          onClick={() => {
            window.speechSynthesis.cancel();
            setMessages([messages[0]]);
          }}
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          title="Reset Conversation"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Messages Feed View */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/50">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 max-w-[85%] sm:max-w-[75%] ${
              msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''
            }`}
          >
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-semibold ${
                msg.sender === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-slate-700 border border-slate-200 shadow-sm'
              }`}
            >
              {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div className="space-y-1.5">
              <div
                className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-sm ${
                  msg.sender === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-none'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                }`}
              >
                <div className="flex justify-between items-start gap-3">
                  <p>{msg.text}</p>
                  
                  {msg.sender === 'bot' && (
                    <button
                      onClick={() => speakText(msg.id, msg.text)}
                      className="p-1 text-slate-400 hover:text-blue-600 transition-colors shrink-0"
                      title="Replay Voice Response"
                    >
                      {speakingMessageId === msg.id ? (
                        <VolumeX className="w-4 h-4 text-blue-600 animate-pulse" />
                      ) : (
                        <Volume2 className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>

                {/* Weather Card Output */}
                {msg.weatherCard && (
                  <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <span className="font-semibold text-blue-700 text-xs flex items-center gap-1">
                        <Compass className="w-3.5 h-3.5" /> {msg.weatherCard.location}
                      </span>
                      <span className="text-base font-bold text-slate-900">{msg.weatherCard.temp}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <CloudRain className="w-3.5 h-3.5 text-blue-500" />
                        <span>{msg.weatherCard.condition}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Droplets className="w-3.5 h-3.5 text-blue-500" />
                        <span>Humidity: {msg.weatherCard.humidity}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Wind className="w-3.5 h-3.5 text-slate-500" />
                        <span>Wind: {msg.weatherCard.wind}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Sun className="w-3.5 h-3.5 text-amber-500" />
                        <span>UV Index: {msg.weatherCard.uv}</span>
                      </div>
                    </div>
                  </div>
                )}

                {msg.action && (
                  <button
                    type="button"
                    onClick={() => {
                      navigate(msg.action.path);
                      onClose?.();
                    }}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-100"
                  >
                    {msg.action.label}
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <span
                className={`text-[10px] text-slate-400 block ${
                  msg.sender === 'user' ? 'text-right' : 'text-left'
                }`}
              >
                {msg.timestamp}
              </span>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-3 max-w-[75%]">
            <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-600 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-3.5 bg-white border border-slate-200 rounded-2xl rounded-tl-none flex items-center gap-1.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce"></span>
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce [animation-delay:0.4s]"></span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="px-4 py-2.5 bg-white border-t border-slate-200 flex items-center gap-2 overflow-x-auto">
        <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0" />
        {quickPrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(prompt)}
            className="px-3 py-1 rounded-full text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors whitespace-nowrap"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="p-4 bg-white border-t border-slate-200 flex items-center gap-2"
      >
        <button
          type="button"
          onClick={toggleVoiceListening}
          className={`p-2.5 rounded-xl border transition-all flex items-center justify-center ${
            isListening
              ? 'bg-red-50 border-red-300 text-red-600 animate-pulse'
              : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-300'
          }`}
          title={isListening ? 'Stop Listening' : 'Speak to Assistant'}
        >
          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isListening ? 'Listening to your voice...' : 'Type or speak a query...'}
          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
        />

        <button
          type="submit"
          disabled={!input.trim() || isTyping}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white p-2.5 rounded-xl transition-colors font-semibold flex items-center justify-center"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}