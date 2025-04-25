import { supabase } from '@/lib/supabase';
import { StatisticsData } from '../types/statistics';

export async function getDailyStats(startDate: string, endDate: string): Promise<StatisticsData[]> {
  const { data, error } = await supabase.rpc('get_daily_stats', {
    p_start_date: startDate,
    p_end_date: endDate,
  });

  if (error) throw error;
  return data;
}

export async function getWeeklyStats(startDate: string, endDate: string): Promise<StatisticsData[]> {
  const { data, error } = await supabase.rpc('get_weekly_stats', {
    p_start_date: startDate,
    p_end_date: endDate,
  });

  if (error) throw error;
  return data;
}

export async function getMonthlyStats(startDate: string, endDate: string): Promise<StatisticsData[]> {
  const { data, error } = await supabase.rpc('get_monthly_stats', {
    p_start_date: startDate,
    p_end_date: endDate,
  });

  if (error) throw error;
  return data;
}

export async function getYearlyStats(startDate: string, endDate: string): Promise<StatisticsData[]> {
  const { data, error } = await supabase.rpc('get_yearly_stats', {
    p_start_date: startDate,
    p_end_date: endDate,
  });

  if (error) throw error;
  return data;
}
