import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  Modal,
  AppState,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Button from '../components/Button';
import Card from '../components/Card';
import ProgressBar from '../components/ProgressBar';
import { useAuth } from '../context/AuthContext';
import PermissionsManager from '../utils/permissionsManager';
import BlockingService from '../utils/blockingSimulator';
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
  const [permissionsGranted, setPermissionsGranted] = useState({});
  const [loading, setLoading] = useState(false);
  const [permissionsList, setPermissionsList] = useState([]);
  const [showGuide, setShowGuide] = useState(false);
  const [guideStep, setGuideStep] = useState(0);

  const appStateRef = useRef(AppState.currentState);

  useEffect(() => {
    const init = async () => {
      const info = PermissionsManager.getPermissionInfo();
      setPermissionsList(info);
      const status = await PermissionsManager.getPermissionStatus();
      setPermissionsGranted(status);
    };
    init();
  }, []);

  // Re-check permissions when user returns from system settings
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextState) => {
      if (appStateRef.current.match(/inactive|background/) && nextState === 'active') {
        // User returned from settings — re-verify all permissions from OS
        if (step === 3) {
          const freshStatus = await PermissionsManager.getPermissionStatus();
          setPermissionsGranted(freshStatus);
        }
      }
      appStateRef.current = nextState;
    });
    return () => subscription.remove();
  }, [step]);

  const toggleApp = (packageName) => {
    setSelectedApps((prev) =>
      prev.includes(packageName)
        ? prev.filter((p) => p !== packageName)
        : [...prev, packageName]
    );
  };

  const handlePermissionRequest = async (perm) => {
    if (perm.hasGuide) {
      setGuideStep(0);
      setShowGuide(true);
      return;
    }

    if (perm.opensSettings) {
      // Opens system settings (Usage Stats / Overlay) — permission is
      // re-verified automatically when user returns via AppState listener
      await PermissionsManager.requestPermission(perm.key);
      return;
    }

    // Notifications — shows real system dialog
    await PermissionsManager.requestPermission(perm.key);
    const freshStatus = await PermissionsManager.getPermissionStatus();
    setPermissionsGranted(freshStatus);
  };

  const handleGuideComplete = async () => {
    await PermissionsManager.markGranted('screenTime');
    setPermissionsGranted((prev) => ({ ...prev, screenTime: true }));
    setShowGuide(false);
  };

  const handleOpenSettingsFromGuide = async () => {
    await PermissionsManager.openScreenTimeSettings();
  };

  const canProceed = () => {
    switch (step) {
      case 0: return !!wisdomPath;
      case 1: return !!dailyTarget;
      case 2: return selectedApps.length > 0;
      case 3: {
        if (Platform.OS === 'ios') {
          return permissionsGranted.notifications && permissionsGranted.screenTime;
        }
        // Android with native module: need all 3 real permissions
        if (BlockingService.isNativeBlockingAvailable()) {
          return permissionsGranted.notifications && permissionsGranted.usageStats && permissionsGranted.overlay;
        }
        // Expo Go fallback: just notifications
        return !!permissionsGranted.notifications;
      }
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

  const guideSteps = PermissionsManager.getScreenTimeGuide();

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
            <Text style={styles.stepTitle}>
              {Platform.OS === 'ios' ? 'Setup app blocking' : 'Grant permissions'}
            </Text>
            <Text style={styles.stepDescription}>
              {Platform.OS === 'ios'
                ? 'We need notification access for daily reminders, and we\'ll guide you through setting up Screen Time to block apps natively.'
                : BlockingService.isNativeBlockingAvailable()
                  ? 'These permissions let Ascend Within detect when you open a restricted app and bring you back to complete your daily task.'
                  : 'Allow notifications for daily reminders to complete your wisdom task.'}
            </Text>

            {/* All permission items — dynamically from PermissionsManager */}
            {permissionsList.map((perm) => {
              const isGranted = permissionsGranted[perm.key];
              return (
                <TouchableOpacity
                  key={perm.key}
                  style={[styles.permItem, isGranted && styles.permItemGranted]}
                  onPress={() => !isGranted && handlePermissionRequest(perm)}
                  activeOpacity={isGranted ? 1 : 0.7}
                  disabled={isGranted}
                >
                  <View style={[styles.permIconWrap, isGranted && styles.permIconWrapGranted]}>
                    <Ionicons
                      name={isGranted ? 'checkmark' : perm.icon}
                      size={24}
                      color={isGranted ? COLORS.white : COLORS.primary}
                    />
                  </View>
                  <View style={styles.permInfo}>
                    <Text style={styles.permTitle}>{perm.title}</Text>
                    <Text style={styles.permDesc}>{perm.description}</Text>
                  </View>
                  {isGranted ? (
                    <Text style={styles.permGrantedLabel}>Granted</Text>
                  ) : (
                    <View style={styles.permAction}>
                      <Text style={styles.permActionText}>{perm.actionLabel}</Text>
                      {perm.opensSettings && (
                        <Ionicons name="open-outline" size={14} color={COLORS.primary} />
                      )}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}

            {/* Android note: settings-based permissions re-check automatically */}
            {Platform.OS === 'android' && BlockingService.isNativeBlockingAvailable() && (
              <Card style={styles.note}>
                <Ionicons name="information-circle-outline" size={18} color={COLORS.textSecondary} />
                <Text style={styles.noteText}>
                  Usage Access and Display Over Apps open your device settings. Enable them for Ascend Within, then come back — we'll detect it automatically.
                </Text>
              </Card>
            )}

            {Platform.OS === 'ios' && !permissionsGranted.screenTime && (
              <Card style={styles.note}>
                <Ionicons name="information-circle-outline" size={18} color={COLORS.textSecondary} />
                <Text style={styles.noteText}>
                  Tap "Setup Guide" above for a step-by-step walkthrough of iOS Screen Time configuration.
                </Text>
              </Card>
            )}
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

      {/* iOS Screen Time Setup Guide Modal */}
      <Modal
        visible={showGuide}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowGuide(false)}
      >
        <SafeAreaView style={styles.guideContainer}>
          <View style={styles.guideHeader}>
            <Text style={styles.guideTitle}>Screen Time Setup</Text>
            <TouchableOpacity onPress={() => setShowGuide(false)} style={styles.guideClose}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.guideProgress}>
            <Text style={styles.guideStepCount}>
              Step {guideStep + 1} of {guideSteps.length}
            </Text>
            <ProgressBar progress={((guideStep + 1) / guideSteps.length) * 100} />
          </View>

          <View style={styles.guideBody}>
            <View style={styles.guideIconCircle}>
              <Ionicons
                name={guideSteps[guideStep].icon}
                size={40}
                color={COLORS.primary}
              />
            </View>
            <Text style={styles.guideStepTitle}>{guideSteps[guideStep].title}</Text>
            <Text style={styles.guideStepDesc}>{guideSteps[guideStep].description}</Text>
          </View>

          <View style={styles.guideFooter}>
            {guideStep === 0 && (
              <Button
                title="Open Settings Now"
                variant="outline"
                onPress={handleOpenSettingsFromGuide}
                style={styles.guideBtn}
              />
            )}

            <View style={styles.guideNavRow}>
              {guideStep > 0 ? (
                <Button
                  title="Previous"
                  variant="outline"
                  onPress={() => setGuideStep(guideStep - 1)}
                  style={styles.guideNavBtn}
                />
              ) : (
                <View style={styles.guideNavBtn} />
              )}

              {guideStep < guideSteps.length - 1 ? (
                <Button
                  title="Next"
                  onPress={() => setGuideStep(guideStep + 1)}
                  style={styles.guideNavBtn}
                />
              ) : (
                <Button
                  title="I've Done This"
                  onPress={handleGuideComplete}
                  style={styles.guideNavBtn}
                />
              )}
            </View>
          </View>
        </SafeAreaView>
      </Modal>
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
  note: {
    marginTop: SPACING.sm,
    backgroundColor: COLORS.surfaceAlt,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
  },
  noteText: {
    ...FONTS.small,
    flex: 1,
    lineHeight: 20,
  },
  // ─── Screen Time Guide Modal ─────────────────────
  guideContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  guideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  guideTitle: {
    ...FONTS.title,
  },
  guideClose: {
    padding: SPACING.xs,
  },
  guideProgress: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
  },
  guideStepCount: {
    ...FONTS.small,
    fontWeight: '500',
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  guideBody: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  guideIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xl,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  guideStepTitle: {
    ...FONTS.subheading,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  guideStepDesc: {
    ...FONTS.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
  },
  guideFooter: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  guideBtn: {
    marginBottom: SPACING.md,
  },
  guideNavRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  guideNavBtn: {
    flex: 1,
  },
});

export default OnboardingScreen;
