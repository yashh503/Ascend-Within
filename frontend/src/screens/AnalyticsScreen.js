import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import Card from '../components/Card';
import ProgressBar from '../components/ProgressBar';
import { useApp } from '../context/AppContext';
import { COLORS, SPACING, FONTS, RADIUS } from '../constants/theme';

const AnalyticsScreen = () => {
  const { analytics, fetchAnalytics } = useApp();
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchAnalytics();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAnalytics();
    setRefreshing(false);
  };

  if (!analytics) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading analytics...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.streakSection}>
          <Card style={styles.streakCard}>
            <Text style={styles.streakNumber}>{analytics.streak.current}</Text>
            <Text style={styles.streakLabel}>Current Streak</Text>
          </Card>
          <Card style={styles.streakCard}>
            <Text style={styles.streakNumber}>{analytics.streak.longest}</Text>
            <Text style={styles.streakLabel}>Longest Streak</Text>
          </Card>
        </View>

        <Card style={styles.completionCard}>
          <View style={styles.completionHeader}>
            <Text style={styles.cardTitle}>Completion Rate</Text>
            <Text style={styles.completionPercent}>{analytics.completionRate}%</Text>
          </View>
          <ProgressBar progress={analytics.completionRate} color={COLORS.success} height={8} />
          <Text style={styles.completionSub}>
            {analytics.completedDays} of {analytics.totalDays} days completed
          </Text>
        </Card>

        <Text style={styles.sectionTitle}>Your Journey</Text>

        <View style={styles.statsGrid}>
          <StatItem
            icon="book-outline"
            value={analytics.totalVersesCompleted}
            label="Verses Completed"
            color={COLORS.primary}
          />
          <StatItem
            icon="lock-closed-outline"
            value={`${analytics.totalBlockedMinutes}m`}
            label="Time Blocked"
            color={COLORS.error}
          />
          <StatItem
            icon="lock-open-outline"
            value={`${analytics.totalUnlockMinutes}m`}
            label="Time Unlocked"
            color={COLORS.success}
          />
          <StatItem
            icon="hand-left-outline"
            value={analytics.totalBlockedAttempts}
            label="Blocked Attempts"
            color={COLORS.warning}
          />
          <StatItem
            icon="pencil-outline"
            value={analytics.reflectionsDone}
            label="Reflections"
            color={COLORS.accent}
          />
          <StatItem
            icon="shield-outline"
            value={analytics.disciplineLevel}
            label="Discipline Level"
            color={COLORS.primaryDark}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const StatItem = ({ icon, value, label, color }) => (
  <Card style={styles.statItem}>
    <Ionicons name={icon} size={24} color={color} />
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
    backgroundColor: COLORS.background,
  },
  loadingText: {
    ...FONTS.body,
    color: COLORS.textSecondary,
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  streakSection: {
    flexDirection: 'row',
    marginBottom: SPACING.lg,
  },
  streakCard: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: SPACING.xs,
  },
  streakNumber: {
    fontSize: 36,
    fontWeight: '700',
    color: COLORS.warning,
  },
  streakLabel: {
    ...FONTS.small,
    marginTop: SPACING.xs,
  },
  completionCard: {
    marginBottom: SPACING.lg,
  },
  completionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  cardTitle: {
    ...FONTS.title,
  },
  completionPercent: {
    ...FONTS.subheading,
    color: COLORS.success,
  },
  completionSub: {
    ...FONTS.small,
    marginTop: SPACING.sm,
  },
  sectionTitle: {
    ...FONTS.subheading,
    marginBottom: SPACING.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -SPACING.xs,
  },
  statItem: {
    width: '47%',
    alignItems: 'center',
    marginHorizontal: '1.5%',
    marginBottom: SPACING.md,
    paddingVertical: SPACING.lg,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: SPACING.sm,
  },
  statLabel: {
    ...FONTS.tiny,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
});

export default AnalyticsScreen;
