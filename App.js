import React, { useEffect } from 'react';
import { View, ActivityIndicator, Image } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Alegreya_400Regular } from '@expo-google-fonts/alegreya';
import { Ionicons } from '@expo/vector-icons';
import NotificationService from './src/services/NotificationService';

import HomeScreen from './src/screens/HomeScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import { COLORS } from './src/constants/colors';
import { SettingsProvider } from './src/context/SettingsContext';

const Tab = createBottomTabNavigator();

export default function App() {
  const [fontsLoaded] = useFonts({
    Alegreya_400Regular,
  });

  useEffect(() => {
    // Initialize notification service permissions
    NotificationService.init();
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SettingsProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarLabelStyle: {
              fontSize: 16,
              fontFamily: 'Alegreya_400Regular',
            },
            tabBarStyle: {
              backgroundColor: '#000000',
              borderTopColor: '#333333',
              height: 105,
              paddingTop: 15,
            },
            tabBarActiveTintColor: '#FFFFFF',
            tabBarInactiveTintColor: '#888888',
            tabBarShowLabel: true,
          }}
        >
          <Tab.Screen
            name="Journal"
            component={HomeScreen}
            options={{
              tabBarIcon: ({ focused }) => (
                <Image
                  source={require('./assets/journal_icon.png')}
                  style={{ width: 40, height: 40, opacity: focused ? 1 : 0.5 }}
                />
              ),
            }}
          />
          <Tab.Screen
            name="Past Entries"
            component={HistoryScreen}
            options={{
              tabBarIcon: ({ focused }) => (
                <Image
                  source={require('./assets/past_entries_icon.png')}
                  style={{ width: 40, height: 40, opacity: focused ? 1 : 0.5 }}
                />
              ),
            }}
          />
          <Tab.Screen
            name="Settings"
            component={SettingsScreen}
            options={{
              tabBarIcon: ({ color, size, focused }) => (
                <Ionicons
                  name={focused ? "settings" : "settings-outline"}
                  size={32}
                  color={color}
                />
              ),
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </SettingsProvider>
  );
}
