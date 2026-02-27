import React, { createContext, useState, useContext, useCallback } from 'react';
import { progressAPI, disciplineAPI } from '../services/api';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [dailyStatus, setDailyStatus] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchDailyStatus = useCallback(async () => {
    try {
      setLoading(true);
      const response = await progressAPI.getStatus();
      setDailyStatus(response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch daily status:', error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAnalytics = useCallback(async () => {
    try {
      const response = await progressAPI.getAnalytics();
      setAnalytics(response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch analytics:', error.message);
    }
  }, []);

  const checkDisciplinePrompt = useCallback(async () => {
    try {
      const response = await disciplineAPI.getPrompt();
      return response.data;
    } catch (error) {
      console.error('Failed to check discipline prompt:', error.message);
      return { shouldPrompt: false };
    }
  }, []);

  return (
    <AppContext.Provider
      value={{
        dailyStatus,
        analytics,
        loading,
        fetchDailyStatus,
        fetchAnalytics,
        checkDisciplinePrompt,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
