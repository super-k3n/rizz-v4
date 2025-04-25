import { StyleSheet } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { useState, useEffect } from 'react';
import { CartesianChart, Line } from 'victory-native';
import { useTheme } from 'react-native-paper';
import { getDailyStats } from '@/src/services/statistics';
import { StatisticsData } from '@/src/types/statistics';
import { format, subDays } from 'date-fns';
import { ja } from 'date-fns/locale';
import { supabase } from '@/lib/supabase';
import { useFont } from '@shopify/react-native-skia';
import React from 'react';

type ChartData = {
  date: number;
  approached: number;
  approachedTarget: number;
  getContacts: number;
  getContactsTarget: number;
  instantDates: number;
  instantDatesTarget: number;
  instantCv: number;
  instantCvTarget: number;
};

export default function StatisticsScreen() {
  const theme = useTheme();
  const [dailyData, setDailyData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const font = useFont(require('@/assets/fonts/SpaceMono-Regular.ttf'), 12);

  useEffect(() => {
    const fetchDailyData = async () => {
      try {
        // セッションの確認
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!session) throw new Error('認証が必要です');

        const endDate = format(new Date(), 'yyyy-MM-dd');
        const startDate = format(subDays(new Date(), 30), 'yyyy-MM-dd');
        console.log('データ取得開始:', { startDate, endDate });

        const data = await getDailyStats(startDate, endDate);
        console.log('取得したデータ:', data);

        const formattedData: ChartData[] = (data as StatisticsData[]).map(item => ({
          date: new Date(item.date).getTime(),
          approached: item.approached,
          approachedTarget: item.approachedTarget || 0,
          getContacts: item.getContacts,
          getContactsTarget: item.getContactsTarget || 0,
          instantDates: item.instantDates,
          instantDatesTarget: item.instantDatesTarget || 0,
          instantCv: item.instantCv,
          instantCvTarget: item.instantCvTarget || 0,
        }));

        console.log('フォーマット済みデータ:', formattedData);
        setDailyData(formattedData);
      } catch (err) {
        console.error('エラーの詳細:', err);
        setError(err instanceof Error ? err : new Error('データの取得に失敗しました'));
      } finally {
        setLoading(false);
      }
    };

    fetchDailyData();
  }, []);

  if (!font) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>フォントの読み込み中...</ThemedText>
      </ThemedView>
    );
  }

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>読み込み中...</ThemedText>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>エラーが発生しました: {error.message}</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        統計データ
      </ThemedText>
      <ThemedText style={styles.description}>
        日、週、月、年ごとのグラフをタブで切り替えて表示します。
      </ThemedText>

      <ThemedView style={styles.chartContainer}>
        <CartesianChart
          data={dailyData}
          xKey="date"
          yKeys={['approached', 'approachedTarget']}
          domainPadding={{ left: 20, right: 20, top: 20 }}
          axisOptions={{
            font,
            formatXLabel: (value) => {
              console.log('formatXLabel value:', value, typeof value);
              if (value === undefined || value === null) {
                return '';
              }
              return format(new Date(value), 'M/d', { locale: ja });
            },
          }}
        >
          {({ points }) => (
            <>
              <Line
                points={points.approached}
                color={theme.colors.primary}
                strokeWidth={2}
              />
              <Line
                points={points.approachedTarget}
                color={theme.colors.primary}
                strokeWidth={2}
              />
            </>
          )}
        </CartesianChart>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 28,
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    marginBottom: 24,
  },
  chartContainer: {
    height: 300,
    marginTop: 16,
  },
});
