export interface Profile {
  id: string;
  user_id: string | null;
  name: string | null;
  email: string | null;
  x_url: string | null;
  theme_preference: 'light' | 'dark';
  created_at: string;
  updated_at: string;
}

export interface ProfileUpdateData {
  name?: string;
  email?: string;
  x_url?: string | null;
  theme_preference?: 'light' | 'dark';
}

export interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
}
