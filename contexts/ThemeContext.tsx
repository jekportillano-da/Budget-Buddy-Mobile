import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSavingsStore } from '../stores';

// Define our theme color structure
interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  accent: string;
  success: string;
  warning: string;
  error: string;
}

interface Theme {
  name: string;
  colors: ThemeColors;
  emoji: string;
}

interface ThemeContextType {
  currentTheme: Theme;
  isLoading: boolean;
}

// Default theme (fallback)
const defaultTheme: Theme = {
  name: 'Default',
  emoji: '⚪',
  colors: {
    primary: '#2196F3',
    secondary: '#FFC107',
    background: '#f5f5f5',
    surface: '#ffffff',
    text: '#333333',
    textSecondary: '#666666',
    accent: '#4CAF50',
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#f44336',
  },
};

// Theme definitions with full color palettes
const themes: Record<string, Theme> = {
  default: defaultTheme,
  bronze_theme: {
    name: 'Bronze',
    emoji: '🥉',
    colors: {
      primary: '#CD7F32',
      secondary: '#B87333',
      background: '#FBF8F3',
      surface: '#ffffff',
      text: '#4A3728',
      textSecondary: '#8B6914',
      accent: '#DAA520',
      success: '#228B22',
      warning: '#FF8C00',
      error: '#DC143C',
    },
  },
  silver_theme: {
    name: 'Silver',
    emoji: '🥈',
    colors: {
      primary: '#C0C0C0',
      secondary: '#A8A8A8',
      background: '#F8F8FF',
      surface: '#ffffff',
      text: '#2F2F2F',
      textSecondary: '#696969',
      accent: '#708090',
      success: '#32CD32',
      warning: '#FFD700',
      error: '#FF6347',
    },
  },
  gold_theme: {
    name: 'Gold',
    emoji: '🥇',
    colors: {
      primary: '#FFD700',
      secondary: '#FFC107',
      background: '#FFFEF7',
      surface: '#ffffff',
      text: '#B8860B',
      textSecondary: '#DAA520',
      accent: '#FF8C00',
      success: '#32CD32',
      warning: '#FF4500',
      error: '#DC143C',
    },
  },
  platinum_theme: {
    name: 'Platinum',
    emoji: '💎',
    colors: {
      primary: '#E5E4E2',
      secondary: '#D3D3D3',
      background: '#F0F8FF',
      surface: '#ffffff',
      text: '#2F4F4F',
      textSecondary: '#708090',
      accent: '#4682B4',
      success: '#20B2AA',
      warning: '#DDA0DD',
      error: '#CD5C5C',
    },
  },
  diamond_theme: {
    name: 'Diamond',
    emoji: '💍',
    colors: {
      primary: '#B9F2FF',
      secondary: '#87CEEB',
      background: '#F0FFFF',
      surface: '#ffffff',
      text: '#191970',
      textSecondary: '#4169E1',
      accent: '#00CED1',
      success: '#00FA9A',
      warning: '#DDA0DD',
      error: '#FF1493',
    },
  },
  elite_theme: {
    name: 'Elite',
    emoji: '👑',
    colors: {
      primary: '#8A2BE2',
      secondary: '#9932CC',
      background: '#F5F0FF',
      surface: '#ffffff',
      text: '#4B0082',
      textSecondary: '#663399',
      accent: '#DA70D6',
      success: '#32CD32',
      warning: '#FFD700',
      error: '#FF69B4',
    },
  },
};

const ThemeContext = createContext<ThemeContextType>({
  currentTheme: defaultTheme,
  isLoading: true,
});

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const { activeTheme, isLoading: savingsLoading } = useSavingsStore();
  const [currentTheme, setCurrentTheme] = useState<Theme>(defaultTheme);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const updateTheme = () => {
      if (__DEV__) {
        console.log('🎨 ThemeProvider: Updating theme to:', activeTheme);
      }
      
      if (activeTheme && themes[activeTheme]) {
        setCurrentTheme(themes[activeTheme]);
        if (__DEV__) {
          console.log('✅ Theme applied:', themes[activeTheme].name);
        }
      } else {
        setCurrentTheme(defaultTheme);
        if (__DEV__) {
          console.log('⚠️ Using default theme, activeTheme:', activeTheme);
        }
      }
      
      setIsLoading(false);
    };

    if (!savingsLoading) {
      updateTheme();
    }
  }, [activeTheme, savingsLoading]);

  const value: ThemeContextType = {
    currentTheme,
    isLoading,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export { themes };
export type { Theme, ThemeColors };