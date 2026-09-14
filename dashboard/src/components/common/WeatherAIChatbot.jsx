import React, { useState, useRef, useEffect } from 'react';
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
  VolumeX
} from 'lucide-react';

export default function WeatherAIChatbot() {
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
    'What is the weather in Shillong today?',
    'Will it rain in Guwahati this evening?',
    'Is it safe to drive through Dima Hasao?',
    'Show current UV index and humidity.',
  ];

  const handleSendMessage = (textToSend) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setIsTyping(true);

    setTimeout(() => {
      let botResponse = {
        id: Date.now() + 1,
        sender: 'bot',
        text: "I'm monitoring the atmospheric data for your query.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        weatherCard: null,
      };

      const lowerQuery = query.toLowerCase();

      if (lowerQuery.includes('shillong')) {
        botResponse.text = "Here is the current weather summary for Shillong. Heavy precipitation has been recorded over the last 6 hours.";
        botResponse.weatherCard = {
          location: 'Shillong, Meghalaya',
          temp: '18°C',
          condition: 'Heavy Rain & Fog',
          humidity: '88%',
          wind: '16 km/h',
          uv: '3 Low',
        };
      } else if (lowerQuery.includes('guwahati') || lowerQuery.includes('rain')) {
        botResponse.text = "Moderate to heavy showers are expected around Guwahati starting from 6:30 PM today. Cumulative rainfall may hit 45mm.";
        botResponse.weatherCard = {
          location: 'Guwahati, Assam',
          temp: '27°C',
          condition: 'Thunderstorms Expected',
          humidity: '82%',
          wind: '22 km/h',
          uv: '5 Moderate',
        };
      } else if (lowerQuery.includes('drive') || lowerQuery.includes('safe') || lowerQuery.includes('dima hasao')) {
        botResponse.text = "Travel Warning: NH-27 stretch near Dima Hasao is under elevated risk for localized landslides due to sustained soil moisture.";
      } else {
        botResponse.text = `Analysis completed for "${query}". Environmental levels are stable with moderate cloud cover and light winds.`;
      }

      setMessages((prev) => [...prev, botResponse]);
      setIsTyping(false);

      // Automatically speak the response aloud
      speakText(botResponse.id, botResponse.text);
    }, 1200);
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