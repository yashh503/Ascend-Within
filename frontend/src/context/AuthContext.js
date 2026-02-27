import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI, verseAPI } from '../services/api';
import BlockingService from '../utils/blockingSimulator';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('token');
      if (storedToken) {
        setToken(storedToken);
        const response = await authAPI.getProfile();
        const loadedUser = response.data.user;
        setUser(loadedUser);

        // Sync restricted apps from server to local storage + native module
        // so the foreground service always has the latest list
        if (loadedUser?.restrictedApps?.length > 0) {
          await BlockingService.setRestrictedApps(loadedUser.restrictedApps);
        }
      }
    } catch (error) {
      await AsyncStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const register = async (name, email, password) => {
    const response = await authAPI.register({ name, email, password });
    const { token: newToken, user: newUser } = response.data;
    await AsyncStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(newUser);
    return newUser;
  };

  const login = async (email, password) => {
    const response = await authAPI.login({ email, password });
    const { token: newToken, user: newUser } = response.data;
    await AsyncStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(newUser);
    return newUser;
  };

  const completeOnboarding = async (wisdomPath, dailyTarget, restrictedApps) => {
    const response = await verseAPI.completeOnboarding({
      wisdomPath,
      dailyTarget,
      restrictedApps,
    });

    // Save restricted apps locally so the native blocking service can read them
    await BlockingService.setRestrictedApps(restrictedApps);
    await BlockingService.setBlockingEnabled(true);

    setUser(response.data.user);
    return response.data.user;
  };

  const updateUser = (updates) => {
    setUser((prev) => ({ ...prev, ...updates }));
  };

  const logout = async () => {
    await AsyncStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        register,
        login,
        logout,
        completeOnboarding,
        updateUser,
        isAuthenticated: !!token,
        isOnboarded: user?.onboardingComplete,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
