import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, View, Modal } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { navigationRef } from './navigationRef';
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
      options={{ headerShown: false, gestureEnabled: false }}
    />
  </Stack.Navigator>
);

// Screens where blocking should NOT interrupt the user
const TASK_SCREENS = ['Reading', 'Quiz', 'Reflection', 'Blocked'];

const AppNavigator = () => {
  const { isAuthenticated, isOnboarded, loading } = useAuth();
  const monitoringStarted = useRef(false);
  const [showBlocked, setShowBlocked] = useState(false);

  useEffect(() => {
    if (isAuthenticated && isOnboarded && !monitoringStarted.current) {
      monitoringStarted.current = true;
      BlockingService.startMonitoring((blockedApp) => {
        console.log('[AppNavigator] onBlocked callback fired for:', blockedApp);

        // Don't interrupt if user is on a task screen
        const currentRoute = navigationRef.current?.getCurrentRoute();
        console.log('[AppNavigator] currentRoute:', currentRoute?.name);

        if (currentRoute && TASK_SCREENS.includes(currentRoute.name)) {
          console.log('[AppNavigator] On task screen, skipping');
          return;
        }

        // Show blocked overlay using React state — this is 100% reliable
        console.log('[AppNavigator] Setting showBlocked = true');
        setShowBlocked(true);
      });
    }

    return () => {
      if (monitoringStarted.current) {
        BlockingService.stopMonitoring();
        monitoringStarted.current = false;
      }
    };
  }, [isAuthenticated, isOnboarded]);

  const handleDismissBlocked = () => {
    setShowBlocked(false);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <>
      <NavigationContainer ref={navigationRef}>
        {!isAuthenticated ? (
          <AuthStack />
        ) : !isOnboarded ? (
          <OnboardingStack />
        ) : (
          <MainStack />
        )}
      </NavigationContainer>

      {/* Blocked overlay — renders on top of everything using Modal */}
      <Modal
        visible={showBlocked}
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => {
          // Prevent Android back button from dismissing
        }}
      >
        <BlockedScreen
          navigation={{
            goBack: handleDismissBlocked,
            navigate: (screen) => {
              setShowBlocked(false);
              // Small delay to let the modal close before navigating
              setTimeout(() => {
                if (navigationRef.current) {
                  navigationRef.current.navigate(screen);
                }
              }, 100);
            },
          }}
        />
      </Modal>
    </>
  );
};

export default AppNavigator;
