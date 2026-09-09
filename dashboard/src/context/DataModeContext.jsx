import React, { createContext, useContext, useState } from 'react';

const DataModeContext = createContext();

export const DataModeProvider = ({ children }) => {
  const [isLiveApi, setIsLiveApi] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [toasts, setToasts] = useState([]);

  const toggleDataMode = (mode) => {
    setIsLiveApi(mode === 'live');
    if (mode === 'live') {
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
