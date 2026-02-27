import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import Card from '../components/Card';
import ProgressBar from '../components/ProgressBar';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { COLORS, SPACING, FONTS, RADIUS, SHADOWS } from '../constants/theme';

const HomeScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { books, fetchBooks, dailyStatus, fetchDailyStatus } = useApp();
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState('');
  const timerRef = useRef(null);

  const getTimeUntilMidnight = () => {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    const diff = midnight - now;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  useEffect(() => {
    setTimeLeft(getTimeUntilMidnight());
    timerRef.current = setInterval(() => {
      setTimeLeft(getTimeUntilMidnight());
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    await Promise.all([fetchBooks(), fetchDailyStatus()]);
    setInitialLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const streak = dailyStatus?.streak;
  const sessions = dailyStatus?.today?.sessions || [];
  const todayCompleted = sessions.some((s) => s.quizPassed);

  if (initialLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <Text style={styles.name}>{user?.name}</Text>
          </View>
          {streak && streak.current > 0 && (
            <View style={styles.streakBadge}>
              <Text style={styles.streakNumber}>{streak.current}</Text>
              <Text style={styles.streakLabel}>day streak</Text>
            </View>
          )}
        </View>

        <View style={[styles.timerCard, todayCompleted && styles.timerCardCompleted]}>
          <View style={[styles.timerIconWrap, todayCompleted && styles.timerIconWrapCompleted]}>
            <Ionicons
              name={todayCompleted ? 'checkmark-circle' : 'time-outline'}
              size={22}
              color={todayCompleted ? COLORS.success : COLORS.warning}
            />
          </View>
          <View style={styles.timerInfo}>
            <Text style={styles.timerLabel}>
              {todayCompleted ? 'Next goal unlocks in' : 'Time left today'}
            </Text>
            <Text style={[styles.timerValue, todayCompleted && styles.timerValueCompleted]}>
              {timeLeft}
            </Text>
          </View>
          <View style={styles.timerHintWrap}>
            <Text style={[styles.timerHint, todayCompleted && styles.timerHintCompleted]}>
              {todayCompleted ? "Today's wisdom earned!" : 'Complete your reading!'}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Your Books</Text>

        {books?.map((book) => {
          const progress = book.totalVerses > 0
            ? (book.totalVersesRead / book.totalVerses) * 100
            : 0;

          return (
            <TouchableOpacity
              key={book.id}
              style={styles.bookCard}
              onPress={() => navigation.navigate('BookDetail', { bookId: book.id, bookName: book.name })}
              activeOpacity={0.7}
            >
              <View style={styles.bookIconWrap}>
                <Ionicons name="book" size={28} color={COLORS.primary} />
              </View>
              <View style={styles.bookInfo}>
                <Text style={styles.bookName}>{book.name}</Text>
                <Text style={styles.bookMeta}>
                  {book.totalChapters} chapters · {book.totalVerses} verses
                </Text>
                <View style={styles.bookProgressRow}>
                  <View style={styles.bookProgressBarWrap}>
                    <ProgressBar progress={progress} />
                  </View>
                  <Text style={styles.bookProgressPercent}>{Math.round(progress)}%</Text>
                </View>
                {book.setupComplete && (
                  <Text style={styles.bookPaceLabel}>
                    {book.chaptersCompleted}/{book.totalChapters} chapters completed
                  </Text>
                )}
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
            </TouchableOpacity>
          );
        })}

        {(!books || books.length === 0) && (
          <Card style={styles.emptyCard}>
            <Ionicons name="library-outline" size={40} color={COLORS.textLight} />
            <Text style={styles.emptyText}>No books available yet. More coming soon!</Text>
          </Card>
        )}

        <View style={styles.statsRow}>
          <StatCard icon="book-outline" value={user?.totalVersesCompleted || 0} label="Verses Read" />
          <StatCard icon="flame-outline" value={streak?.longest || 0} label="Best Streak" />
          <StatCard icon="shield-outline" value={user?.disciplineLevel || 1} label="Wisdom Level" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const StatCard = ({ icon, value, label }) => (
  <Card style={styles.statCard}>
    <Ionicons name={icon} size={22} color={COLORS.primary} />
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </Card>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  greeting: {
    ...FONTS.body,
    color: COLORS.textSecondary,
  },
  name: {
    ...FONTS.heading,
    fontSize: 24,
  },
  streakBadge: {
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.warning,
  },
  streakNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.warning,
  },
  streakLabel: {
    ...FONTS.tiny,
    color: COLORS.warning,
  },
  timerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.warning,
    ...SHADOWS.small,
  },
  timerCardCompleted: {
    borderColor: COLORS.success,
  },
  timerIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: `${COLORS.warning}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  timerIconWrapCompleted: {
    backgroundColor: `${COLORS.success}15`,
  },
  timerInfo: {
    flex: 1,
  },
  timerLabel: {
    ...FONTS.small,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  timerValue: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.warning,
    fontVariant: ['tabular-nums'],
  },
  timerValueCompleted: {
    color: COLORS.success,
  },
  timerHintWrap: {
    maxWidth: 90,
  },
  timerHint: {
    ...FONTS.tiny,
    color: COLORS.textSecondary,
    textAlign: 'right',
  },
  timerHintCompleted: {
    color: COLORS.success,
    fontWeight: '600',
  },
  sectionTitle: {
    ...FONTS.subheading,
    marginBottom: SPACING.md,
  },
  bookCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  bookIconWrap: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.md,
    backgroundColor: `${COLORS.primary}12`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  bookInfo: {
    flex: 1,
  },
  bookName: {
    ...FONTS.title,
    marginBottom: 2,
  },
  bookMeta: {
    ...FONTS.small,
    marginBottom: SPACING.sm,
  },
  bookProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bookProgressBarWrap: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  bookProgressPercent: {
    ...FONTS.tiny,
    fontWeight: '600',
    color: COLORS.primary,
    width: 32,
    textAlign: 'right',
  },
  bookPaceLabel: {
    ...FONTS.tiny,
    marginTop: SPACING.xs,
    color: COLORS.success,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  emptyText: {
    ...FONTS.body,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.lg,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: SPACING.xs,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: SPACING.xs,
  },
  statLabel: {
    ...FONTS.tiny,
    marginTop: 2,
  },
});

export default HomeScreen;
