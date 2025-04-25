export interface StatisticsData {
  date: string;
  approached: number;
  getContacts: number;
  instantDates: number;
  instantCv: number;
  approachedTarget?: number;
  getContactsTarget?: number;
  instantDatesTarget?: number;
  instantCvTarget?: number;
}

export type PeriodType = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface StatisticsContextType {
  data: Record<PeriodType, StatisticsData[]>;
  loading: boolean;
  error: Error | null;
  period: PeriodType;
  setPeriod: (period: PeriodType) => void;
  fetchData: (period: PeriodType, startDate: string, endDate: string) => Promise<void>;
}
