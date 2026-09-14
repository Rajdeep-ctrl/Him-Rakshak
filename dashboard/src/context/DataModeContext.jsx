import React, { createContext, useContext, useState, useEffect } from 'react';

const DataModeContext = createContext();

export const DataModeProvider = ({ children }) => {
  // Read initial saved state from localStorage (Defaults to MOCK if not set, or set to your preference)
  const [isLiveApi, setIsLiveApi] = useState(() => {
    const saved = localStorage.getItem('app_data_mode');
    return saved ? saved === 'LIVE' : false;
  });
  const [apiError, setApiError] = useState(null);
  const [toasts, setToasts] = useState([]);

  // Toggle function handles state update, localStorage persistence, and dispatching event
  const toggleDataMode = (mode) => {
    const isLive = mode === 'live' || mode === 'LIVE';
    setIsLiveApi(isLive);
    
    // Save selection in localStorage
    localStorage.setItem('app_data_mode', isLive ? 'LIVE' : 'MOCK');

    // Notify non-context modules (like api.js) about the mode change
    window.dispatchEvent(new Event('dataModeChanged'));

    if (isLive) {
      addToast('Attempting Live API connection...', 'info');
    } else {
      addToast('Switched to Mock Data Mode', 'info');
      setApiError(null);
    }
  };

  const addToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <DataModeContext.Provider
      value={{
        isLiveApi,
        toggleDataMode,
        apiError,
        setApiError,
        toasts,
        addToast,
        removeToast,
      }}
    >
      {children}
    </DataModeContext.Provider>
  );
};

export const useDataMode = () => useContext(DataModeContext);