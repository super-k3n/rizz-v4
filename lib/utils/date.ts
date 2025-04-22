import { PeriodType } from '../types/record';

export const getWeekStartDate = (date: Date): string => {
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(date.setDate(diff)).toISOString().split('T')[0];
};

export const getMonthStartDate = (date: Date): string => {
  return new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
};

export const getYearStartDate = (date: Date): string => {
  return new Date(date.getFullYear(), 0, 1).toISOString().split('T')[0];
};

export const getStartDateByPeriod = (period: PeriodType, date: Date): string => {
  switch (period) {
    case 'daily':
      return date.toISOString().split('T')[0];
    case 'weekly':
      return getWeekStartDate(date);
    case 'monthly':
      return getMonthStartDate(date);
    case 'yearly':
      return getYearStartDate(date);
  }
};

export const getEndDateByPeriod = (period: PeriodType, startDate: string): string => {
  const date = new Date(startDate);
  switch (period) {
    case 'daily':
      return startDate;
    case 'weekly':
      const weekEnd = new Date(date);
      weekEnd.setDate(date.getDate() + 6);
      return weekEnd.toISOString().split('T')[0];
    case 'monthly':
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      return monthEnd.toISOString().split('T')[0];
    case 'yearly':
      const yearEnd = new Date(date.getFullYear(), 11, 31);
      return yearEnd.toISOString().split('T')[0];
  }
};
