import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Button from '../components/Button';
import Card from '../components/Card';
import ProgressBar from '../components/ProgressBar';
import { useAuth } from '../context/AuthContext';
import { COLORS, SPACING, FONTS, RADIUS, SHADOWS } from '../constants/theme';

const STEPS = ['Wisdom Path', 'Daily Target', 'Restrict Apps', 'Permissions'];

const SIMULATED_APPS = [
  { name: 'Instagram', package: 'com.instagram.android' },
  { name: 'Twitter / X', package: 'com.twitter.android' },
  { name: 'TikTok', package: 'com.zhiliaoapp.musically' },
  { name: 'YouTube', package: 'com.google.android.youtube' },
  { name: 'Facebook', package: 'com.facebook.katana' },
  { name: 'Snapchat', package: 'com.snapchat.android' },
  { name: 'Reddit', package: 'com.reddit.frontpage' },
  { name: 'Netflix', package: 'com.netflix.mediaclient' },
  { name: 'WhatsApp', package: 'com.whatsapp' },
  { name: 'Telegram', package: 'org.telegram.messenger' },
];

const OnboardingScreen = () => {
  const { completeOnboarding } = useAuth();
  const [step, setStep] = useState(0);
  const [wisdomPath, setWisdomPath] = useState(null);
  const [dailyTarget, setDailyTarget] = useState(null);
  const [selectedApps, setSelectedApps] = useState([]);
  const [permissionsGranted, setPermissionsGranted] = useState({
    usage: false,
    accessibility: false,
    overlay: false,
  });
  const [loading, setLoading] = useState(false);

  const toggleApp = (packageName) => {
    setSelectedApps((prev) =>
      prev.includes(packageName)
        ? prev.filter((p) => p !== packageName)
        : [...prev, packageName]
    );
  };

  const simulatePermission = (key) => {
    setPermissionsGranted((prev) => ({ ...prev, [key]: true }));
  };

  const canProceed = () => {
    switch (step) {
      case 0: return !!wisdomPath;
      case 1: return !!dailyTarget;
      case 2: return selectedApps.length > 0;
      case 3: return Object.values(permissionsGranted).every(Boolean);
      default: return false;
    }
  };

  const handleNext = async () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      setLoading(true);
      try {
        await completeOnboarding(wisdomPath, dailyTarget, selectedApps);
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
            <Text style={styles.stepTitle}>Set your daily target</Text>
            <Text style={styles.stepDescription}>
              How many verses would you like to read each day? Start small if you are new.
            </Text>
            {[
              { value: 1, label: '1 verse', desc: 'Gentle start — perfect for beginners' },
              { value: 5, label: '5 verses', desc: 'Moderate — build a steady practice' },
              { value: 10, label: '10 verses', desc: 'Committed — for dedicated practitioners' },
            ].map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[styles.targetCard, dailyTarget === option.value && styles.targetCardSelected]}
                onPress={() => setDailyTarget(option.value)}
                activeOpacity={0.7}
              >
                <View>
                  <Text style={styles.targetLabel}>{option.label}</Text>
                  <Text style={styles.targetDesc}>{option.desc}</Text>
                </View>
                {dailyTarget === option.value && (
                  <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        );

      case 2:
        return (
          <View>
            <Text style={styles.stepTitle}>Select apps to restrict</Text>
            <Text style={styles.stepDescription}>
              Choose the apps you want to lock until you complete your daily wisdom task.
            </Text>
            <ScrollView style={styles.appList} showsVerticalScrollIndicator={false}>
              {SIMULATED_APPS.map((app) => {
                const isSelected = selectedApps.includes(app.package);
                return (
                  <TouchableOpacity
                    key={app.package}
                    style={[styles.appItem, isSelected && styles.appItemSelected]}
                    onPress={() => toggleApp(app.package)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.appName}>{app.name}</Text>
                    <Ionicons
                      name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                      size={24}
                      color={isSelected ? COLORS.primary : COLORS.textLight}
                    />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <Text style={styles.selectedCount}>
              {selectedApps.length} app{selectedApps.length !== 1 ? 's' : ''} selected
            </Text>
          </View>
        );

      case 3:
        return (
          <View>
            <Text style={styles.stepTitle}>Grant permissions</Text>
            <Text style={styles.stepDescription}>
              These permissions help the app monitor and manage your screen time.
            </Text>
            {[
              {
                key: 'usage',
                icon: 'time-outline',
                title: 'Usage Access',
                desc: 'Track which apps you open',
              },
              {
                key: 'accessibility',
                icon: 'accessibility-outline',
                title: 'Accessibility Service',
                desc: 'Detect foreground apps',
              },
              {
                key: 'overlay',
                icon: 'layers-outline',
                title: 'Overlay Permission',
                desc: 'Show blocking screen over apps',
              },
            ].map((perm) => (
              <TouchableOpacity
                key={perm.key}
                style={[
                  styles.permItem,
                  permissionsGranted[perm.key] && styles.permItemGranted,
                ]}
                onPress={() => simulatePermission(perm.key)}
                activeOpacity={0.7}
                disabled={permissionsGranted[perm.key]}
              >
                <Ionicons
                  name={perm.icon}
                  size={28}
                  color={permissionsGranted[perm.key] ? COLORS.success : COLORS.primary}
                />
                <View style={styles.permInfo}>
                  <Text style={styles.permTitle}>{perm.title}</Text>
                  <Text style={styles.permDesc}>{perm.desc}</Text>
                </View>
                {permissionsGranted[perm.key] ? (
                  <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
                ) : (
                  <Text style={styles.permGrant}>Grant</Text>
                )}
              </TouchableOpacity>
            ))}

            <Card style={styles.note}>
              <Text style={styles.noteText}>
                In this version, permissions are simulated. On a real device, these would open system settings.
              </Text>
            </Card>
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
  targetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 2,
    borderColor: COLORS.border,
    ...SHADOWS.small,
  },
  targetCardSelected: {
    borderColor: COLORS.primary,
  },
  targetLabel: {
    ...FONTS.title,
    marginBottom: 2,
  },
  targetDesc: {
    ...FONTS.small,
  },
  appList: {
    maxHeight: 360,
  },
  appItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  appItemSelected: {
    borderColor: COLORS.primary,
    backgroundColor: '#FAF8F5',
  },
  appName: {
    ...FONTS.body,
    fontWeight: '500',
  },
  selectedCount: {
    ...FONTS.small,
    textAlign: 'center',
    marginTop: SPACING.md,
    fontWeight: '500',
  },
  permItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    ...SHADOWS.small,
  },
  permItemGranted: {
    borderColor: COLORS.success,
    backgroundColor: '#F5FAF3',
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
  },
  permGrant: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  note: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.surfaceAlt,
  },
  noteText: {
    ...FONTS.small,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default OnboardingScreen;
