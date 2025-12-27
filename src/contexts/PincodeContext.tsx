import React, { createContext, useContext, useState, useEffect } from 'react';

interface PincodeContextType {
  pincode: string;
  setPincode: (pincode: string) => void;
  isServiceable: boolean;
  setIsServiceable: (isServiceable: boolean) => void;
}

const PincodeContext = createContext<PincodeContextType | undefined>(undefined);

export const PincodeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pincode, setPincodeState] = useState<string>(() => {
    return localStorage.getItem('ehcf-pincode') || '';
  });
  
  const [isServiceable, setIsServiceableState] = useState<boolean>(() => {
    const saved = localStorage.getItem('ehcf-pincode-serviceable');
    return saved === 'true';
  });

  useEffect(() => {
    if (pincode) {
      localStorage.setItem('ehcf-pincode', pincode);
    } else {
      localStorage.removeItem('ehcf-pincode');
    }
  }, [pincode]);

  useEffect(() => {
    localStorage.setItem('ehcf-pincode-serviceable', String(isServiceable));
  }, [isServiceable]);

  const setPincode = (newPincode: string) => {
    setPincodeState(newPincode);
  };

  const setIsServiceable = (serviceable: boolean) => {
    setIsServiceableState(serviceable);
  };

  return (
    <PincodeContext.Provider
      value={{
        pincode,
        setPincode,
        isServiceable,
        setIsServiceable,
      }}
    >
      {children}
    </PincodeContext.Provider>
  );
};

export const usePincode = () => {
  const context = useContext(PincodeContext);
  if (!context) {
    throw new Error('usePincode must be used within PincodeProvider');
  }
  return context;
};
