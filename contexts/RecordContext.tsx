import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RecordContextType, DailyRecord, CounterType, PeriodType, PeriodicRecord } from '../lib/types/record';
import { getStartDateByPeriod, getEndDateByPeriod } from '../lib/utils/date';

const RECORDS_STORAGE_KEY = '@rizz_records';

const RecordContext = createContext<RecordContextType | undefined>(undefined);

export const RecordProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [records, setRecords] = useState<Record<string, DailyRecord>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    try {
      const data = await AsyncStorage.getItem(RECORDS_STORAGE_KEY);
      if (data) {
        setRecords(JSON.parse(data));
      }
    } catch (error) {
      console.error('Failed to load records:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveRecords = async (newRecords: Record<string, DailyRecord>) => {
    try {
      await AsyncStorage.setItem(RECORDS_STORAGE_KEY, JSON.stringify(newRecords));
      setRecords(newRecords);
    } catch (error) {
      console.error('Failed to save records:', error);
    }
  };

  const addRecord = useCallback(async (type: CounterType, date: string, count: number = 1) => {
    const newRecords = { ...records };
    if (!newRecords[date]) {
      newRecords[date] = {
        date,
        approached: 0,
        getContact: 0,
        instantDate: 0,
        instantCv: 0,
      };
    }
    newRecords[date][type] += count;
    await saveRecords(newRecords);
  }, [records]);

  const getRecordByDate = useCallback((date: string): DailyRecord | null => {
    return records[date] || null;
  }, [records]);

  const getRecordsByPeriod = useCallback((period: PeriodType, startDate: string): PeriodicRecord => {
    const start = getStartDateByPeriod(period, new Date(startDate));
    const end = getEndDateByPeriod(period, start);

    const periodRecords = Object.values(records).filter(record => {
      const recordDate = new Date(record.date);
      return recordDate >= new Date(start) && recordDate <= new Date(end);
    });

    const initialRecord: PeriodicRecord = {
      period,
      startDate: start,
      endDate: end,
      approached: 0,
      getContact: 0,
      instantDate: 0,
      instantCv: 0,
    };

    return periodRecords.reduce((acc, record) => ({
      ...acc,
      approached: acc.approached + record.approached,
      getContact: acc.getContact + record.getContact,
      instantDate: acc.instantDate + record.instantDate,
      instantCv: acc.instantCv + record.instantCv,
    }), initialRecord);
  }, [records]);

  const value = {
    records,
    addRecord,
    getRecordByDate,
    getRecordsByPeriod,
    loading,
  };

  return (
    <RecordContext.Provider value={value}>
      {children}
    </RecordContext.Provider>
  );
};

export const useRecord = () => {
  const context = useContext(RecordContext);
  if (context === undefined) {
    throw new Error('useRecord must be used within a RecordProvider');
  }
  return context;
};
