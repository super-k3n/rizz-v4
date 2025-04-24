import { StyleSheet } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ProfileSettings } from '@/components/profile/ProfileSettings';

export default function SettingsScreen() {
  return (
    <ThemedView style={styles.container}>
      <ProfileSettings />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
