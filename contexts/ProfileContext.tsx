import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Profile, ProfileUpdateData } from '../src/types/profile';
import * as profileService from '../services/profile';
import { useAuth } from './AuthContext';

interface ProfileContextType {
  profile: Profile | null;
  loading: boolean;
  error: Error | null;
  updateProfile: (data: ProfileUpdateData) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  updateTheme: (theme: 'light' | 'dark') => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const useProfile = (): ProfileContextType => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};

interface ProfileProviderProps {
  children: ReactNode;
}

export const ProfileProvider: React.FC<ProfileProviderProps> = ({ children }) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const { session } = useAuth();

  const refreshProfile = async (): Promise<void> => {
    if (!session) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const profileData = await profileService.getProfile();
      
      // プロフィールのテーマ設定がない場合、ダークモードをデフォルトに設定
      if (profileData && profileData.theme_preference !== 'dark') {
        try {
          await profileService.updateTheme('dark');
          const updatedProfile = await profileService.getProfile();
          setProfile(updatedProfile);
        } catch (themeErr) {
          console.error('テーマ設定エラー:', themeErr);
          // テーマ更新エラーは無視して元のプロフィールを設定
          setProfile(profileData);
        }
      } else {
        setProfile(profileData);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshProfile();
  }, [session]);

  const updateProfile = async (data: ProfileUpdateData): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const updatedProfile = await profileService.updateProfile(data);
      setProfile(updatedProfile);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      await profileService.changePassword(currentPassword, newPassword);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateTheme = async (theme: 'light' | 'dark'): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const updatedProfile = await profileService.updateTheme(theme);
      setProfile(updatedProfile);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const value: ProfileContextType = {
    profile,
    loading,
    error,
    updateProfile,
    changePassword,
    updateTheme,
    refreshProfile,
  };

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
};
