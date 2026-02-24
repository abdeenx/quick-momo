import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingsContextType {
  numberFormat: string;
  codeFormat: string;
  setNumberFormat: (format: string) => void;
  setCodeFormat: (format: string) => void;
}

const defaultNumberFormat = '*182*1*1*{number}*{amount}#';
const defaultCodeFormat = '*182*8*1*{code}*{amount}#';

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [numberFormat, setNumberFormatState] = useState(defaultNumberFormat);
  const [codeFormat, setCodeFormatState] = useState(defaultCodeFormat);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedNumberFormat = await AsyncStorage.getItem('numberFormat');
      const savedCodeFormat = await AsyncStorage.getItem('codeFormat');
      
      if (savedNumberFormat) setNumberFormatState(savedNumberFormat);
      if (savedCodeFormat) setCodeFormatState(savedCodeFormat);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const setNumberFormat = async (format: string) => {
    setNumberFormatState(format);
    try {
      await AsyncStorage.setItem('numberFormat', format);
    } catch (error) {
      console.error('Error saving number format:', error);
    }
  };

  const setCodeFormat = async (format: string) => {
    setCodeFormatState(format);
    try {
      await AsyncStorage.setItem('codeFormat', format);
    } catch (error) {
      console.error('Error saving code format:', error);
    }
  };

  return (
    <SettingsContext.Provider value={{ 
      numberFormat, 
      codeFormat, 
      setNumberFormat, 
      setCodeFormat 
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}