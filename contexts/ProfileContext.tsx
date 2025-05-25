import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Profile, ProfileUpdateData } from '../src/types/profile';
import * as profileService from '../services/profile';
import { useAuth } from './AuthContext';
import i18n from '../src/libs/i18n';

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

      let currentProfile = profileData; // 現在処理中のプロファイルデータ

      // プロフィールのテーマ設定がない場合、ダークモードをデフォルトに設定
      if (currentProfile && currentProfile.theme_preference !== 'dark') {
        try {
          // テーマ更新が成功した場合、更新されたプロファイルデータを反映
          currentProfile = await profileService.updateTheme('dark');
          console.log('Default theme set to dark.');
        } catch (themeErr) {
          console.error('テーマ設定エラー:', themeErr);
          // エラーが発生しても処理を続行し、元のprofileDataを使う
        }
      }

      // ★ここが修正点2: プロフィールロード時にi18nの言語を設定
      if (currentProfile && currentProfile.language !== null) {
        const langCode = currentProfile.language === 0 ? 'ja' : 'en';
        if (i18n.language !== langCode) { // i18nの現在の言語と異なる場合のみ切り替える
          await i18n.changeLanguage(langCode);
          console.log(`i18n language set from profile: ${langCode}`);
        }
      } else {
        // profile.languageがnullの場合、デバイスのロケールに従うか、特定のデフォルトを設定することも可能
        // 現在のi18n.tsの設定 (Localization.locale) を尊重するため、ここでは特別な処理は行わない
        console.log('Profile language is null, using default i18n language.');
      }

      setProfile(currentProfile); // 最終的なプロファイルをセット

    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // セッションが変更されたときにプロフィールをリフレッシュ
    refreshProfile();
  }, [session]); // sessionを依存配列に追加

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
