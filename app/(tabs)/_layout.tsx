import { Tabs } from 'expo-router';
import React from 'react';
import { Text, Animated, Easing } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

export default function TabLayout() {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.currentTheme.colors.primary,
        tabBarInactiveTintColor: theme.currentTheme.colors.textSecondary,
        headerStyle: {
          backgroundColor: theme.currentTheme.colors.primary,
        },
        headerShadowVisible: false,
        headerTintColor: theme.currentTheme.colors.surface,
        tabBarStyle: {
          backgroundColor: theme.currentTheme.colors.surface,
          borderTopColor: theme.currentTheme.colors.primary,
          borderTopWidth: 2,
          elevation: 8,
          shadowColor: theme.currentTheme.colors.primary,
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.3,
          shadowRadius: 4,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon name={focused ? 'home' : 'home-outline'} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="bills"
        options={{
          title: 'Bills',
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon name={focused ? 'receipt' : 'receipt-outline'} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="ledger"
        options={{
          title: 'Ledger',
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon name={focused ? 'wallet' : 'wallet-outline'} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: 'Insights',
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon name={focused ? 'analytics' : 'analytics-outline'} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon name={focused ? 'person' : 'person-outline'} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon name={focused ? 'settings' : 'settings-outline'} color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

// Animated tab icon component
function AnimatedTabIcon({ 
  name, 
  color, 
  focused 
}: { 
  name: string; 
  color: string; 
  focused: boolean;
}) {
  const getEmoji = () => {
    if (name === 'bug' || name === 'bug-outline') return '🐛';
    if (name === 'home' || name === 'home-outline') return '🏠';
    if (name === 'receipt' || name === 'receipt-outline') return '🧾';
    if (name === 'wallet' || name === 'wallet-outline') return '💰';
    if (name === 'analytics' || name === 'analytics-outline') return '📊';
    if (name === 'person' || name === 'person-outline') return '👤';
    return '⚙️';
  };
  
  return (
    <Text style={{ 
      color, 
      fontSize: focused ? 24 : 20,
      transform: [{ scale: focused ? 1.1 : 1 }]
    }}>
      {getEmoji()}
    </Text>
  );
}
