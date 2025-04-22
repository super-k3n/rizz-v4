import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoalContextType, GoalValues, PeriodType } from '../lib/types/record';

const GOALS_STORAGE_KEY = '@rizz_goals';

const getDefaultGoals = (): Record<PeriodType, GoalValues> => ({
  daily: { period: 'daily', approached: 0, getContact: 0, instantDate: 0, instantCv: 0 },
  weekly: { period: 'weekly', approached: 0, getContact: 0, instantDate: 0, instantCv: 0 },
  monthly: { period: 'monthly', approached: 0, getContact: 0, instantDate: 0, instantCv: 0 },
  yearly: { period: 'yearly', approached: 0, getContact: 0, instantDate: 0, instantCv: 0 },
});

const GoalContext = createContext<GoalContextType | undefined>(undefined);

export const GoalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [goals, setGoals] = useState<Record<PeriodType, GoalValues>>(getDefaultGoals());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    try {
      const data = await AsyncStorage.getItem(GOALS_STORAGE_KEY);
      if (data) {
        setGoals(JSON.parse(data));
      }
    } catch (error) {
      console.error('Failed to load goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveGoals = async (newGoals: Record<PeriodType, GoalValues>) => {
    try {
      await AsyncStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(newGoals));
      setGoals(newGoals);
    } catch (error) {
      console.error('Failed to save goals:', error);
    }
  };

  const setGoal = useCallback(async (period: PeriodType, values: GoalValues) => {
    const newGoals = { ...goals, [period]: values };
    await saveGoals(newGoals);
  }, [goals]);

  const getGoal = useCallback((period: PeriodType): GoalValues => {
    return goals[period];
  }, [goals]);

  const value = {
    goals,
    setGoal,
    getGoal,
    loading,
  };

  return (
    <GoalContext.Provider value={value}>
      {children}
    </GoalContext.Provider>
  );
};

export const useGoal = () => {
  const context = useContext(GoalContext);
  if (context === undefined) {
    throw new Error('useGoal must be used within a GoalProvider');
  }
  return context;
};
