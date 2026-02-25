import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, View, AppState } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { navigationRef, navigate } from './navigationRef';
import BlockingService from '../utils/blockingSimulator';
import { COLORS } from '../constants/theme';

import WelcomeScreen from '../screens/WelcomeScreen';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import HomeScreen from '../screens/HomeScreen';
import ReadingScreen from '../screens/ReadingScreen';
import QuizScreen from '../screens/QuizScreen';
import ReflectionScreen from '../screens/ReflectionScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import BlockedScreen from '../screens/BlockedScreen';
import LeaderboardScreen from '../screens/LeaderboardScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const screenOptions = {
  headerStyle: { backgroundColor: COLORS.background },
  headerTintColor: COLORS.text,
  headerTitleStyle: { fontWeight: '600' },
  headerShadowVisible: false,
  contentStyle: { backgroundColor: COLORS.background },
};

const AuthStack = () => (
  <Stack.Navigator screenOptions={{ ...screenOptions, headerShown: false }}>
    <Stack.Screen name="Welcome" component={WelcomeScreen} />
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Signup" component={SignupScreen} />
  </Stack.Navigator>
);

const OnboardingStack = () => (
  <Stack.Navigator screenOptions={{ ...screenOptions, headerShown: false }}>
    <Stack.Screen name="Onboarding" component={OnboardingScreen} />
  </Stack.Navigator>
);

const MainTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      ...screenOptions,
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;
        if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
        else if (route.name === 'Leaderboard') iconName = focused ? 'trophy' : 'trophy-outline';
        else if (route.name === 'Analytics') iconName = focused ? 'bar-chart' : 'bar-chart-outline';
        else if (route.name === 'Settings') iconName = focused ? 'settings' : 'settings-outline';
        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: COLORS.primary,
      tabBarInactiveTintColor: COLORS.textLight,
      tabBarStyle: {
        backgroundColor: COLORS.surface,
        borderTopColor: COLORS.border,
        paddingBottom: 4,
      },
      tabBarLabelStyle: { fontSize: 12, fontWeight: '500' },
    })}
  >
    <Tab.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
    <Tab.Screen name="Leaderboard" component={LeaderboardScreen} options={{ title: 'Leaderboard' }} />
    <Tab.Screen name="Analytics" component={AnalyticsScreen} options={{ title: 'Analytics' }} />
    <Tab.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
  </Tab.Navigator>
);

const MainStack = () => (
  <Stack.Navigator screenOptions={screenOptions}>
    <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
    <Stack.Screen name="Reading" component={ReadingScreen} options={{ title: 'Daily Reading' }} />
    <Stack.Screen name="Quiz" component={QuizScreen} options={{ title: 'Knowledge Check' }} />
    <Stack.Screen name="Reflection" component={ReflectionScreen} options={{ title: 'Reflect' }} />
    <Stack.Screen
      name="Blocked"
      component={BlockedScreen}
      options={{ headerShown: false, presentation: 'fullScreenModal', gestureEnabled: false }}
    />
  </Stack.Navigator>
);

// Screens where blocking should NOT interrupt the user
const TASK_SCREENS = ['Reading', 'Quiz', 'Reflection', 'Blocked'];

const AppNavigator = () => {
  const { isAuthenticated, isOnboarded, loading } = useAuth();
  const appStateRef = useRef(AppState.currentState);
  const monitoringStarted = useRef(false);

  useEffect(() => {
    if (isAuthenticated && isOnboarded && !monitoringStarted.current) {
      monitoringStarted.current = true;
      BlockingService.startMonitoring((blockedApp) => {
        // Don't interrupt if user is on a task screen
        const currentRoute = navigationRef.current?.getCurrentRoute();
        if (currentRoute && TASK_SCREENS.includes(currentRoute.name)) {
          return;
        }
        navigate('Blocked');
      });
    }

    return () => {
      if (monitoringStarted.current) {
        BlockingService.stopMonitoring();
        monitoringStarted.current = false;
      }
    };
  }, [isAuthenticated, isOnboarded]);

  // When app comes back to foreground (service brought us back),
  // the native module's onHostResume fires and emits "onAppBlocked".
  // But we also handle the case where JS wasn't ready yet:
  useEffect(() => {
    if (!isAuthenticated || !isOnboarded) return;

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextState === 'active'
      ) {
        // Small delay to let the native module's onHostResume fire first
        setTimeout(() => {
          const currentRoute = navigationRef.current?.getCurrentRoute();
          if (currentRoute && !TASK_SCREENS.includes(currentRoute.name)) {
            // The native onHostResume + event listener should handle navigation,
            // but this is a safety fallback
          }
        }, 300);
      }
      appStateRef.current = nextState;
    });

    return () => subscription.remove();
  }, [isAuthenticated, isOnboarded]);

  const handleNavigationStateChange = () => {
    const currentRoute = navigationRef.current?.getCurrentRoute();
    if (currentRoute) {
      const isTaskScreen = TASK_SCREENS.includes(currentRoute.name);
      BlockingService.setOnTaskScreen(isTaskScreen);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer
      ref={navigationRef}
      onStateChange={handleNavigationStateChange}
    >
      {!isAuthenticated ? (
        <AuthStack />
      ) : !isOnboarded ? (
        <OnboardingStack />
      ) : (
        <MainStack />
      )}
    </NavigationContainer>
  );
};

export default AppNavigator;
