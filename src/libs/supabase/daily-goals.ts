import { Database } from '@/types/database.types'
import { createClient } from '@/utils/supabase/client'

const supabase = createClient()

type DailyGoal = Database['public']['Tables']['daily_goals']['Row']
type InsertDailyGoal = Database['public']['Tables']['daily_goals']['Insert']
type UpdateDailyGoal = Database['public']['Tables']['daily_goals']['Update']

export const getDailyGoal = async (date: string): Promise<DailyGoal | null> => {
  const { data, error } = await supabase
    .from('daily_goals')
    .select('*')
    .eq('target_date', date)
    .single()

  if (error) {
    console.error('Error fetching daily goal:', error)
    return null
  }

  return data
}

export const getDailyGoalsByDateRange = async (
  startDate: string,
  endDate: string
): Promise<DailyGoal[]> => {
  const { data, error } = await supabase
    .from('daily_goals')
    .select('*')
    .gte('target_date', startDate)
    .lte('target_date', endDate)
    .order('target_date', { ascending: true })

  if (error) {
    console.error('Error fetching daily goals:', error)
    return []
  }

  return data
}

export const createDailyGoal = async (goal: InsertDailyGoal): Promise<DailyGoal | null> => {
  const { data, error } = await supabase
    .from('daily_goals')
    .insert([goal])
    .select()
    .single()

  if (error) {
    console.error('Error creating daily goal:', error)
    return null
  }

  return data
}

export const updateDailyGoal = async (
  id: string,
  updates: UpdateDailyGoal
): Promise<DailyGoal | null> => {
  const { data, error } = await supabase
    .from('daily_goals')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating daily goal:', error)
    return null
  }

  return data
}

export const deleteDailyGoal = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('daily_goals')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting daily goal:', error)
    return false
  }

  return true
}

export const upsertDailyGoal = async (goal: InsertDailyGoal): Promise<DailyGoal | null> => {
  const { data, error } = await supabase
    .from('daily_goals')
    .upsert([goal], {
      onConflict: 'user_id,target_date',
      ignoreDuplicates: false,
    })
    .select()
    .single()

  if (error) {
    console.error('Error upserting daily goal:', error)
    return null
  }

  return data
}
