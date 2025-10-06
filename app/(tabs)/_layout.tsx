import { Tabs } from 'expo-router';
import React from 'react';
import { View, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

export default function TabLayout() {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.currentTheme.colors.primary,
        tabBarInactiveTintColor: theme.currentTheme.colors.textSecondary,
        headerStyle: {
          backgroundColor: theme.currentTheme.colors.surface,
        },
        headerTitleStyle: { color: theme.currentTheme.colors.text },
        headerShadowVisible: false,
        headerTintColor: theme.currentTheme.colors.text,
        tabBarShowLabel: true,
        tabBarLabelStyle: { fontSize: theme.tokens.typography.xs },
        tabBarStyle: {
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: 12,
          height: 64,
          paddingBottom: 10,
          paddingTop: 10,
          backgroundColor: Platform.OS === 'ios' ? 'rgba(255,255,255,0.9)' : theme.currentTheme.colors.surface,
          borderRadius: theme.tokens.radius.lg,
          borderTopWidth: 0,
          elevation: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? 'home' : 'home-outline'} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="bills"
        options={{
          title: 'Bills',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? 'receipt' : 'receipt-outline'} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="ledger"
        options={{
          title: 'Ledger',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? 'wallet' : 'wallet-outline'} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: 'Insights',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? 'analytics' : 'analytics-outline'} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? 'person' : 'person-outline'} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? 'settings' : 'settings-outline'} color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

// Vector tab icon with subtle active pill
function TabIcon({ name, color, focused }: { name: string; color: string; focused: boolean }) {
  const { tokens, currentTheme } = useTheme();
  return (
    <View
      style={{
        paddingHorizontal: focused ? 12 : 0,
        paddingVertical: focused ? 6 : 0,
        backgroundColor: focused ? currentTheme.colors.background : 'transparent',
        borderRadius: tokens.radius.full,
      }}
    >
      <Ionicons name={name as any} size={focused ? 26 : 22} color={color} />
    </View>
  );
}
