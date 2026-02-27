import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Button from '../components/Button';
import Card from '../components/Card';
import ProgressBar from '../components/ProgressBar';
import { useAuth } from '../context/AuthContext';
import PermissionsManager from '../utils/permissionsManager';
import { COLORS, SPACING, FONTS, RADIUS, SHADOWS } from '../constants/theme';

const STEPS = ['Wisdom Path', 'Notifications'];

const OnboardingScreen = () => {
  const { completeOnboarding } = useAuth();
  const [step, setStep] = useState(0);
  const [wisdomPath, setWisdomPath] = useState(null);
  const [notificationGranted, setNotificationGranted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const init = async () => {
      const granted = await PermissionsManager.checkNotificationStatus();
      setNotificationGranted(granted);
    };
    init();
  }, []);

  const handleRequestNotifications = async () => {
    const granted = await PermissionsManager.requestNotifications();
    setNotificationGranted(granted);
  };

  const canProceed = () => {
    switch (step) {
      case 0: return !!wisdomPath;
      case 1: return true;
      default: return false;
    }
  };

  const handleNext = async () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      setLoading(true);
      try {
        await completeOnboarding(wisdomPath);
      } catch (error) {
        Alert.alert('Error', error.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <View>
            <Text style={styles.stepTitle}>Choose your wisdom path</Text>
            <Text style={styles.stepDescription}>
              Select a tradition to draw daily wisdom from. More paths coming soon.
            </Text>
            <TouchableOpacity
              style={[styles.pathCard, wisdomPath === 'hinduism' && styles.pathCardSelected]}
              onPress={() => setWisdomPath('hinduism')}
              activeOpacity={0.7}
            >
              <Text style={styles.pathIcon}>🙏</Text>
              <View style={styles.pathInfo}>
                <Text style={styles.pathTitle}>Hinduism</Text>
                <Text style={styles.pathSubtitle}>Bhagavad Gita — Timeless wisdom for the mind</Text>
              </View>
              {wisdomPath === 'hinduism' && (
                <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
              )}
            </TouchableOpacity>

            <Card style={styles.comingSoon}>
              <Text style={styles.comingSoonText}>
                Buddhism, Stoicism, and more paths are coming in future updates.
              </Text>
            </Card>
          </View>
        );

      case 1:
        return (
          <View>
            <Text style={styles.stepTitle}>Enable notifications</Text>
            <Text style={styles.stepDescription}>
              Get a gentle daily reminder to complete your wisdom reading and reflection.
            </Text>

            <TouchableOpacity
              style={[styles.permItem, notificationGranted && styles.permItemGranted]}
              onPress={() => !notificationGranted && handleRequestNotifications()}
              activeOpacity={notificationGranted ? 1 : 0.7}
              disabled={notificationGranted}
            >
              <View style={[styles.permIconWrap, notificationGranted && styles.permIconWrapGranted]}>
                <Ionicons
                  name={notificationGranted ? 'checkmark' : 'notifications-outline'}
                  size={24}
                  color={notificationGranted ? COLORS.white : COLORS.primary}
                />
              </View>
              <View style={styles.permInfo}>
                <Text style={styles.permTitle}>Daily Reminders</Text>
                <Text style={styles.permDesc}>Get notified every morning to complete your wisdom task</Text>
              </View>
              {notificationGranted ? (
                <Text style={styles.permGrantedLabel}>Granted</Text>
              ) : (
                <View style={styles.permAction}>
                  <Text style={styles.permActionText}>Allow</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.progressRow}>
          <Text style={styles.stepIndicator}>
            Step {step + 1} of {STEPS.length}
          </Text>
          {step > 0 && (
            <TouchableOpacity onPress={() => setStep(step - 1)}>
              <Text style={styles.backLink}>Back</Text>
            </TouchableOpacity>
          )}
        </View>
        <ProgressBar progress={((step + 1) / STEPS.length) * 100} />
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        {renderStep()}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={step === STEPS.length - 1 ? 'Start Your Journey' : 'Continue'}
          onPress={handleNext}
          disabled={!canProceed()}
          loading={loading}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  stepIndicator: {
    ...FONTS.small,
    fontWeight: '500',
  },
  backLink: {
    ...FONTS.small,
    color: COLORS.primary,
    fontWeight: '600',
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  footer: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
    paddingTop: SPACING.sm,
  },
  stepTitle: {
    ...FONTS.subheading,
    marginBottom: SPACING.xs,
  },
  stepDescription: {
    ...FONTS.body,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
    lineHeight: 24,
  },
  pathCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 2,
    borderColor: COLORS.border,
    ...SHADOWS.small,
  },
  pathCardSelected: {
    borderColor: COLORS.primary,
  },
  pathIcon: {
    fontSize: 36,
    marginRight: SPACING.md,
  },
  pathInfo: {
    flex: 1,
  },
  pathTitle: {
    ...FONTS.title,
    marginBottom: 2,
  },
  pathSubtitle: {
    ...FONTS.small,
  },
  comingSoon: {
    marginTop: SPACING.lg,
    backgroundColor: COLORS.surfaceAlt,
  },
  comingSoonText: {
    ...FONTS.small,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  permItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    ...SHADOWS.small,
  },
  permItemGranted: {
    borderColor: COLORS.success,
    backgroundColor: '#F5FAF3',
  },
  permIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  permIconWrapGranted: {
    backgroundColor: COLORS.success,
  },
  permInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  permTitle: {
    ...FONTS.title,
    fontSize: 16,
    marginBottom: 2,
  },
  permDesc: {
    ...FONTS.small,
    lineHeight: 18,
  },
  permAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  permActionText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  permGrantedLabel: {
    ...FONTS.small,
    color: COLORS.success,
    fontWeight: '600',
  },
});

export default OnboardingScreen;
