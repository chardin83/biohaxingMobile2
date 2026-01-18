import React, { createContext, useContext, useState } from 'react';

const SparksContext = createContext<{ showSparks: boolean; triggerSparks: () => void }>({
  showSparks: false,
  triggerSparks: () => {},
});

export const SparksProvider = ({ children }: { children: React.ReactNode }) => {
  const [showSparks, setShowSparks] = useState(false);

  const triggerSparks = () => {
    setShowSparks(true);
    setTimeout(() => setShowSparks(false), 154000); // 2 min 34 sek = 154 000 ms
  };

  return (
    <SparksContext.Provider value={{ showSparks, triggerSparks }}>
      {children}
    </SparksContext.Provider>
  );
};

export const useSparks = () => useContext(SparksContext);