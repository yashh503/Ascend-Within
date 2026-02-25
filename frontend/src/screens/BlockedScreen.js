import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; 
import { Ionicons } from '@expo/vector-icons';
import Button from '../components/Button';
import Card from '../components/Card';
import { useApp } from '../context/AppContext';
import { progressAPI } from '../services/api';
import BlockingService from '../utils/blockingSimulator';
import { COLORS, SPACING, FONTS, RADIUS } from '../constants/theme';

const BlockedScreen = ({ navigation }) => {
  const { dailyStatus, fetchDailyStatus, isUnlocked, getUnlockTimeRemaining } = useApp();
  const [recorded, setRecorded] = useState(false);

  useEffect(() => {
    fetchDailyStatus();
    if (!recorded) {
      progressAPI.recordBlocked().catch(() => {});
      setRecorded(true);
    }
  }, []);

  // Prevent hardware back button from dismissing when locked
  useEffect(() => {
    const status = dailyStatus?.today;
    const unlocked = isUnlocked();
    const canDismiss = unlocked || status?.quizPassed;

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!canDismiss) {
        // Block the back button — user must complete the task
        return true;
      }
      return false;
    });

    return () => backHandler.remove();
  }, [dailyStatus]);

  const status = dailyStatus?.today;
  const unlocked = isUnlocked();

  // ─── Unlocked state ─────────────────────────────────
  if (unlocked) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={[styles.iconContainer, styles.iconContainerUnlocked]}>
            <Ionicons name="lock-open-outline" size={56} color={COLORS.success} />
          </View>
          <Text style={styles.title}>Apps Unlocked</Text>
          <Text style={styles.message}>
            You have {getUnlockTimeRemaining()} minutes of access remaining. Go use your apps!
          </Text>
          <Button
            title="Continue"
            onPress={() => navigation.goBack()}
            style={styles.button}
          />
        </View>
      </SafeAreaView>
    );
  }

  const hasCompletedTask = status?.quizPassed;

  // ─── Expired unlock state ──────────────────────────
  if (hasCompletedTask) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons name="time-outline" size={56} color={COLORS.warning} />
          </View>
          <Text style={styles.title}>Unlock Expired</Text>
          <Text style={styles.message}>
            Your unlock window has ended. Complete tomorrow's task to unlock again.
          </Text>
          <Button
            title="Return Home"
            variant="outline"
            onPress={() => navigation.goBack()}
            style={styles.button}
          />
        </View>
      </SafeAreaView>
    );
  }

  // ─── Locked state — user must complete the task ────
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="lock-closed" size={56} color={COLORS.error} />
        </View>

        <Text style={styles.title}>Apps Restricted</Text>
        <Text style={styles.message}>
          Your selected apps are blocked until you complete today's wisdom reading and quiz.
        </Text>

        <Card style={styles.stepsCard}>
          <StepRow
            number="1"
            label="Read today's verses"
            done={status?.versesRead > 0}
          />
          <StepRow
            number="2"
            label="Pass the knowledge quiz (70%+)"
            done={status?.quizPassed}
          />
          <StepRow
            number="3"
            label="Write your reflection"
            done={status?.reflectionDone}
            last
          />
        </Card>

        <Button
          title="Start Today's Reading"
          onPress={() => {
            navigation.goBack();
            setTimeout(() => navigation.navigate('Reading'), 100);
          }}
          style={styles.button}
        />

        <Text style={styles.hint}>
          Complete the steps above to unlock your apps for 20 minutes.
        </Text>
      </View>
    </SafeAreaView>
  );
};

const StepRow = ({ number, label, done, last }) => (
  <View style={[styles.stepRow, !last && styles.stepRowBorder]}>
    <View style={[styles.stepCircle, done && styles.stepCircleDone]}>
      {done ? (
        <Ionicons name="checkmark" size={14} color={COLORS.white} />
      ) : (
        <Text style={styles.stepNumber}>{number}</Text>
      )}
    </View>
    <Text style={[styles.stepLabel, done && styles.stepLabelDone]}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  iconContainer: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#FDF2F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  iconContainerUnlocked: {
    backgroundColor: '#F0F9EE',
  },
  title: {
    ...FONTS.heading,
    fontSize: 22,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  message: {
    ...FONTS.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SPACING.lg,
  },
  stepsCard: {
    width: '100%',
    marginBottom: SPACING.lg,
    padding: SPACING.md,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  stepRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  stepCircleDone: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  stepNumber: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  stepLabel: {
    ...FONTS.body,
    fontSize: 15,
    flex: 1,
  },
  stepLabelDone: {
    color: COLORS.success,
    textDecorationLine: 'line-through',
  },
  button: {
    width: '100%',
    marginBottom: SPACING.md,
  },
  hint: {
    ...FONTS.small,
    color: COLORS.textLight,
    textAlign: 'center',
  },
});

export default BlockedScreen;
