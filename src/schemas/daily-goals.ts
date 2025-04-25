import * as z from 'zod'

export const dailyGoalSchema = z.object({
  target_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日付はYYYY-MM-DD形式で入力してください'),
  approached_target: z.number()
    .int('整数で入力してください')
    .min(1, '1以上の値を入力してください'),
  get_contacts_target: z.number()
    .int('整数で入力してください')
    .min(0, '0以上の値を入力してください')
    .refine((val) => val <= z.get('approached_target'), {
      message: '声かけ目標以下の値を入力してください',
    }),
  instant_dates_target: z.number()
    .int('整数で入力してください')
    .min(0, '0以上の値を入力してください')
    .refine((val) => val <= z.get('get_contacts_target'), {
      message: '連絡先取得目標以下の値を入力してください',
    }),
  instant_cv_target: z.number()
    .int('整数で入力してください')
    .min(0, '0以上の値を入力してください')
    .refine((val) => val <= z.get('instant_dates_target'), {
      message: '即日デート目標以下の値を入力してください',
    }),
})

export type DailyGoalFormData = z.infer<typeof dailyGoalSchema>

export const validateDailyGoal = (data: unknown) => {
  return dailyGoalSchema.safeParse(data)
}

export const validateDailyGoalField = (field: keyof DailyGoalFormData, value: unknown) => {
  const fieldSchema = dailyGoalSchema.shape[field]
  return fieldSchema.safeParse(value)
}
