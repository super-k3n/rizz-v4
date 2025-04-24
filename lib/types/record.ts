export type CounterType = 'approached' | 'getContact' | 'instantDate' | 'instantCv';
export type PeriodType = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface DailyRecord {
  date: string;
  approached: number;
  getContact: number;
  instantDate: number;
  instantCv: number;
}

export interface PeriodicRecord {
  period: PeriodType;
  startDate: string;
  endDate: string;
  approached: number;
  getContact: number;
  instantDate: number;
  instantCv: number;
}

export interface GoalValues {
  period: PeriodType;
  approached: number;
  getContact: number;
  instantDate: number;
  instantCv: number;
}

export interface RecordContextType {
  records: Record<string, DailyRecord>;
  addRecord: (type: CounterType, date: string, count?: number) => Promise<void>;
  getRecordByDate: (date: string) => DailyRecord | null;
  getRecordsByPeriod: (period: PeriodType, startDate: string) => PeriodicRecord;
  loading: boolean;
}

export interface GoalContextType {
  goals: Record<PeriodType, GoalValues>;
  loading: boolean;
  error: Error | null;
  isOnline: boolean;
  setGoal: (period: PeriodType, values: GoalValues) => Promise<void>;
  getGoal: (period: PeriodType) => GoalValues;
  updateGoal: (period: PeriodType, values: Partial<GoalValues>) => Promise<void>;
  resetGoal: (period: PeriodType) => Promise<void>;
  syncGoals: () => Promise<void>;
}
