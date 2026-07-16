// src/navigation/RootNavigator.tsx

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Shadow } from '../utils/theme';

// Screens
import { HomeScreen } from '../screens/HomeScreen';
import { ServersScreen } from '../screens/ServersScreen';
import { AddServerScreen } from '../screens/AddServerScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { LogsScreen } from '../screens/LogsScreen';
import { ServerDetailScreen } from '../screens/ServerDetailScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function TabIcon({ name, focused, color }: { name: any; focused: boolean; color: string }) {
  return (
    <View style={[styles.tabIcon, focused && styles.tabIconActive]}>
      <Ionicons name={name} size={22} color={color} />
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: styles.tabLabel,
        tabBarShowLabel: true,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Ana Sayfa',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name={focused ? 'shield' : 'shield-outline'} focused={focused} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Servers"
        component={ServersScreen}
        options={{
          tabBarLabel: 'Sunucular',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name={focused ? 'server' : 'server-outline'} focused={focused} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Logs"
        component={LogsScreen}
        options={{
          tabBarLabel: 'Günlük',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name={focused ? 'terminal' : 'terminal-outline'} focused={focused} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Ayarlar',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name={focused ? 'settings' : 'settings-outline'} focused={focused} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: Colors.bg },
      }}
    >
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen
        name="AddServer"
        component={AddServerScreen}
        options={{
          presentation: 'modal',
          cardStyle: { backgroundColor: Colors.bgModal },
        }}
      />
      <Stack.Screen
        name="ServerDetail"
        component={ServerDetailScreen}
        options={{
          presentation: 'card',
        }}
      />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.bgCard,
    borderTopColor: Colors.border,
    borderTopWidth: 1,
    height: Platform.OS === 'ios' ? 84 : 64,
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    paddingTop: 8,
    ...Shadow.card,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  tabIcon: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.sm,
  },
  tabIconActive: {
    backgroundColor: Colors.primary + '20',
  },
});
