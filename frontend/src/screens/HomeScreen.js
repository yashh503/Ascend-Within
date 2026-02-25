import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Modal,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; 
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import Card from '../components/Card';
import Button from '../components/Button';
import ProgressBar from '../components/ProgressBar';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { disciplineAPI } from '../services/api';
import { COLORS, SPACING, FONTS, RADIUS } from '../constants/theme';

const HomeScreen = ({ navigation }) => {
  const { user, updateUser } = useAuth();
  const { dailyStatus, fetchDailyStatus, checkDisciplinePrompt, isUnlocked, getUnlockTimeRemaining } = useApp();
  const [refreshing, setRefreshing] = useState(false);
  const [showDisciplineModal, setShowDisciplineModal] = useState(false);
  const [disciplineData, setDisciplineData] = useState(null);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    await fetchDailyStatus();
    const promptData = await checkDisciplinePrompt();
    if (promptData?.shouldPrompt) {
      setDisciplineData(promptData);
      setShowDisciplineModal(true);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleDisciplineAction = async (action) => {
    try {
      const response = await disciplineAPI.update({ action });
      updateUser({
        disciplineLevel: response.data.disciplineLevel,
        dailyTarget: response.data.dailyTarget,
        restrictedApps: response.data.restrictedApps,
      });
      setShowDisciplineModal(false);
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const status = dailyStatus?.today;
  const streak = dailyStatus?.streak;

  const getProgress = () => {
    if (!status) return 0;
    let steps = 0;
    if (status.versesRead > 0) steps++;
    if (status.quizPassed) steps++;
    if (status.reflectionDone) steps++;
    return (steps / 3) * 100;
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

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

        <Card style={styles.progressCard}>
          <Text style={styles.progressTitle}>Today's Progress</Text>
          <ProgressBar progress={getProgress()} />
          <View style={styles.checklistRow}>
            <CheckItem done={status?.versesRead > 0} label="Read verses" />
            <CheckItem done={status?.quizPassed} label="Pass quiz" />
            <CheckItem done={status?.reflectionDone} label="Reflect" />
          </View>
        </Card>

        {isUnlocked() && (
          <Card style={[styles.unlockCard, { backgroundColor: '#F5FAF3' }]}>
            <Ionicons name="lock-open-outline" size={24} color={COLORS.success} />
            <View style={styles.unlockInfo}>
              <Text style={styles.unlockTitle}>Apps Unlocked</Text>
              <Text style={styles.unlockTime}>{getUnlockTimeRemaining()} minutes remaining</Text>
            </View>
          </Card>
        )}

        {!status?.versesRead && (
          <Button
            title="Start Today's Reading"
            onPress={() => navigation.navigate('Reading')}
            style={styles.ctaButton}
          />
        )}

        {status?.versesRead > 0 && !status?.quizPassed && (
          <Button
            title="Take the Quiz"
            onPress={() => navigation.navigate('Quiz')}
            style={styles.ctaButton}
          />
        )}

        {status?.quizPassed && !status?.reflectionDone && (
          <Button
            title="Write Your Reflection"
            onPress={() => navigation.navigate('Reflection')}
            style={styles.ctaButton}
          />
        )}

        {status?.quizPassed && status?.reflectionDone && (
          <Card style={styles.completedCard}>
            <Ionicons name="checkmark-circle" size={32} color={COLORS.success} />
            <Text style={styles.completedText}>
              Today's journey is complete. Rest well.
            </Text>
            <TouchableOpacity
              style={styles.rereadButton}
              onPress={() => navigation.navigate('Reading')}
              activeOpacity={0.7}
            >
              <Ionicons name="book-outline" size={18} color={COLORS.primary} />
              <Text style={styles.rereadText}>Re-read Today's Verses</Text>
            </TouchableOpacity>
          </Card>
        )}

        <View style={styles.statsRow}>
          <StatCard
            icon="book-outline"
            value={user?.totalVersesCompleted || 0}
            label="Verses Read"
          />
          <StatCard
            icon="flame-outline"
            value={streak?.longest || 0}
            label="Best Streak"
          />
          <StatCard
            icon="shield-outline"
            value={user?.disciplineLevel || 1}
            label="Level"
          />
        </View>
      </ScrollView>

      <Modal
        visible={showDisciplineModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDisciplineModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Ready to grow?</Text>
            <Text style={styles.modalSubtitle}>
              You have been consistent for a week. Would you like to increase your discipline level?
            </Text>
            {disciplineData?.options?.map((option) => (
              <TouchableOpacity
                key={option.action}
                style={[styles.modalOption, option.disabled && styles.modalOptionDisabled]}
                onPress={() => !option.disabled && handleDisciplineAction(option.action)}
                disabled={option.disabled}
                activeOpacity={0.7}
              >
                <Text style={styles.modalOptionLabel}>{option.label}</Text>
                <Text style={styles.modalOptionDesc}>{option.description}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.modalDismiss}
              onPress={() => setShowDisciplineModal(false)}
            >
              <Text style={styles.modalDismissText}>Maybe later</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const CheckItem = ({ done, label }) => (
  <View style={styles.checkItem}>
    <Ionicons
      name={done ? 'checkmark-circle' : 'ellipse-outline'}
      size={20}
      color={done ? COLORS.success : COLORS.textLight}
    />
    <Text style={[styles.checkLabel, done && styles.checkLabelDone]}>{label}</Text>
  </View>
);

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
  scrollContent: {
    padding: SPACING.lg,
    paddingTop: SPACING.xl,
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
  progressCard: {
    marginBottom: SPACING.lg,
  },
  progressTitle: {
    ...FONTS.title,
    marginBottom: SPACING.md,
  },
  checklistRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.md,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkLabel: {
    ...FONTS.small,
    marginLeft: SPACING.xs,
  },
  checkLabelDone: {
    color: COLORS.success,
  },
  unlockCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  unlockInfo: {
    marginLeft: SPACING.md,
  },
  unlockTitle: {
    ...FONTS.title,
    fontSize: 16,
    color: COLORS.success,
  },
  unlockTime: {
    ...FONTS.small,
    color: COLORS.success,
  },
  ctaButton: {
    marginBottom: SPACING.lg,
  },
  completedCard: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  completedText: {
    ...FONTS.body,
    color: COLORS.success,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  rereadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.primary,
    gap: SPACING.sm,
  },
  rereadText: {
    ...FONTS.small,
    color: COLORS.primary,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
  },
  modalTitle: {
    ...FONTS.subheading,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  modalSubtitle: {
    ...FONTS.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  modalOption: {
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  modalOptionDisabled: {
    opacity: 0.4,
  },
  modalOptionLabel: {
    ...FONTS.title,
    fontSize: 15,
    marginBottom: 2,
  },
  modalOptionDesc: {
    ...FONTS.small,
  },
  modalDismiss: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
    marginTop: SPACING.sm,
  },
  modalDismissText: {
    ...FONTS.small,
    color: COLORS.primary,
    fontWeight: '600',
  },
});

export default HomeScreen;
