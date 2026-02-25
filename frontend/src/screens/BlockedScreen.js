import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Button from '../components/Button';
import { useApp } from '../context/AppContext';
import { progressAPI } from '../services/api';
import { COLORS, SPACING, FONTS } from '../constants/theme';

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

  const status = dailyStatus?.today;
  const unlocked = isUnlocked();

  if (unlocked) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Ionicons name="lock-open-outline" size={64} color={COLORS.success} />
          <Text style={styles.title}>Apps Unlocked</Text>
          <Text style={styles.message}>
            You have {getUnlockTimeRemaining()} minutes of access remaining.
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="lock-closed" size={64} color={COLORS.primary} />
        </View>

        <Text style={styles.title}>This app is restricted</Text>

        {!hasCompletedTask ? (
          <>
            <Text style={styles.message}>
              Complete today's wisdom reading and quiz to unlock your apps.
            </Text>
            <Button
              title="Go to Today's Reading"
              onPress={() => {
                navigation.goBack();
                setTimeout(() => navigation.navigate('Reading'), 100);
              }}
              style={styles.button}
            />
          </>
        ) : (
          <>
            <Text style={styles.message}>
              Your unlock window has expired. Complete tomorrow's task to unlock again.
            </Text>
            <Button
              title="Return Home"
              variant="outline"
              onPress={() => navigation.goBack()}
              style={styles.button}
            />
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  title: {
    ...FONTS.heading,
    fontSize: 22,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  message: {
    ...FONTS.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: SPACING.xl,
  },
  button: {
    width: '100%',
  },
});

export default BlockedScreen;
