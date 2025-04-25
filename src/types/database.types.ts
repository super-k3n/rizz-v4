export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      daily_goals: {
        Row: {
          id: string
          user_id: string
          target_date: string
          approached_target: number
          get_contacts_target: number
          instant_dates_target: number
          instant_cv_target: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          target_date: string
          approached_target: number
          get_contacts_target: number
          instant_dates_target: number
          instant_cv_target: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          target_date?: string
          approached_target?: number
          get_contacts_target?: number
          instant_dates_target?: number
          instant_cv_target?: number
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
