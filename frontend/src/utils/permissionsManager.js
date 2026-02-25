import { Platform, Linking, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import BlockingService from './blockingSimulator';

const PERMISSIONS_KEY = 'app_permissions_status';

/**
 * Permissions Manager
 *
 * ANDROID (dev build with native module):
 *   1. Notifications — real system dialog via expo-notifications
 *   2. Usage Stats — opens system settings, verified via native module
 *   3. Overlay — opens system settings, verified via native module
 *
 * ANDROID (Expo Go fallback — no native module):
 *   1. Notifications only
 *
 * iOS:
 *   1. Notifications — real system dialog via expo-notifications
 *   2. Screen Time guide — walk user through iOS native app limits
 */

const PermissionsManager = {

  // ─── State persistence ─────────────────────────────────

  async getPermissionStatus() {
    try {
      const stored = await AsyncStorage.getItem(PERMISSIONS_KEY);
      const parsed = stored ? JSON.parse(stored) : {};

      // Always verify real permissions from OS
      const notifGranted = await this._checkNotificationsReal();
      parsed.notifications = notifGranted;

      if (Platform.OS === 'android' && BlockingService.isNativeBlockingAvailable()) {
        parsed.usageStats = await BlockingService.hasUsageStatsPermission();
        parsed.overlay = await BlockingService.hasOverlayPermission();
      }

      if (!parsed.platform) parsed.platform = Platform.OS;
      return parsed;
    } catch (_) {
      return this._defaultStatus();
    }
  },

  _defaultStatus() {
    return {
      notifications: false,
      usageStats: false,
      overlay: false,
      screenTime: false,
      platform: Platform.OS,
    };
  },

  async _save(status) {
    status.platform = Platform.OS;
    await AsyncStorage.setItem(PERMISSIONS_KEY, JSON.stringify(status));
  },

  // ─── Real checks ──────────────────────────────────────

  async _checkNotificationsReal() {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      return status === 'granted';
    } catch {
      return false;
    }
  },

  // ─── Notification permission (both platforms) ──────────

  async requestNotifications() {
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') {
      await this._scheduleDailyReminder();
      return true;
    }

    const { status } = await Notifications.requestPermissionsAsync();
    if (status === 'granted') {
      await this._scheduleDailyReminder();
      return true;
    }

    Alert.alert(
      'Notifications Disabled',
      'Without notifications you won\'t get daily reminders. You can enable them in your device settings.',
      [
        { text: 'Open Settings', onPress: () => Linking.openSettings() },
        { text: 'Skip', style: 'cancel' },
      ],
    );
    return false;
  },

  async _scheduleDailyReminder() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Time for wisdom',
          body: 'Your daily verses are waiting. Complete them to unlock your apps!',
          sound: true,
        },
        trigger: {
          type: 'daily',
          hour: 8,
          minute: 0,
        },
      });
    } catch (_) {}
  },

  // ─── iOS Screen Time guide ────────────────────────────

  async openScreenTimeSettings() {
    try {
      await Linking.openURL('app-settings:');
      return true;
    } catch {
      Alert.alert(
        'Unable to Open Settings',
        'Please open the Settings app manually and navigate to Screen Time > App Limits.',
      );
      return false;
    }
  },

  // ─── Unified request ──────────────────────────────────

  async requestPermission(key) {
    if (key === 'notifications') {
      await this.requestNotifications();
      // Always re-verify from OS
      const granted = await this._checkNotificationsReal();
      const status = await this.getPermissionStatus();
      status.notifications = granted;
      await this._save(status);
      return granted;
    }

    if (key === 'usageStats') {
      // Opens system settings — user must enable manually
      await BlockingService.openUsageStatsSettings();
      // We return false here; the status will be re-checked when user returns
      return false;
    }

    if (key === 'overlay') {
      await BlockingService.openOverlaySettings();
      return false;
    }

    if (key === 'screenTime') {
      return await this.openScreenTimeSettings();
    }

    return false;
  },

  async markGranted(key) {
    const status = await this.getPermissionStatus();
    status[key] = true;
    await this._save(status);
  },

  // ─── Check helpers ────────────────────────────────────

  async areAllGranted() {
    const s = await this.getPermissionStatus();
    if (Platform.OS === 'ios') {
      return s.notifications && s.screenTime;
    }
    if (BlockingService.isNativeBlockingAvailable()) {
      return s.notifications && s.usageStats && s.overlay;
    }
    // Expo Go fallback — just notifications
    return s.notifications;
  },

  async checkNotificationStatus() {
    return this._checkNotificationsReal();
  },

  async refreshStatus() {
    const status = await this.getPermissionStatus();
    await this._save(status);
    return status;
  },

  async reset() {
    await AsyncStorage.removeItem(PERMISSIONS_KEY);
  },

  // ─── Permission cards per platform ────────────────────

  getPermissionInfo() {
    if (Platform.OS === 'ios') {
      return [
        {
          key: 'notifications',
          icon: 'notifications-outline',
          title: 'Daily Reminders',
          description: 'Get notified every morning to complete your wisdom task',
          actionLabel: 'Allow',
          required: true,
        },
        {
          key: 'screenTime',
          icon: 'hourglass-outline',
          title: 'Screen Time Setup',
          description: 'Set app limits in iOS Settings so restricted apps are blocked natively',
          actionLabel: 'Setup Guide',
          required: true,
          hasGuide: true,
        },
      ];
    }

    // Android with native module
    if (BlockingService.isNativeBlockingAvailable()) {
      return [
        {
          key: 'notifications',
          icon: 'notifications-outline',
          title: 'Daily Reminders',
          description: 'Get notified every morning to complete your wisdom task',
          actionLabel: 'Allow',
          required: true,
        },
        {
          key: 'usageStats',
          icon: 'time-outline',
          title: 'Usage Access',
          description: 'Detect which app you open so we can enforce blocking',
          actionLabel: 'Grant',
          required: true,
          opensSettings: true,
        },
        {
          key: 'overlay',
          icon: 'layers-outline',
          title: 'Display Over Apps',
          description: 'Bring Ascend Within to front when a restricted app is opened',
          actionLabel: 'Grant',
          required: true,
          opensSettings: true,
        },
      ];
    }

    // Android without native module (Expo Go) — notifications only
    return [
      {
        key: 'notifications',
        icon: 'notifications-outline',
        title: 'Daily Reminders',
        description: 'Get notified every morning to complete your wisdom task',
        actionLabel: 'Allow',
        required: true,
      },
    ];
  },

  // ─── iOS Screen Time step-by-step guide ───────────────

  getScreenTimeGuide() {
    return [
      {
        step: 1,
        title: 'Open Settings',
        description: 'Open the Settings app on your iPhone',
        icon: 'settings-outline',
      },
      {
        step: 2,
        title: 'Tap Screen Time',
        description: 'Scroll down and tap "Screen Time". If it\'s off, tap "Turn On Screen Time" first.',
        icon: 'hourglass-outline',
      },
      {
        step: 3,
        title: 'Tap App Limits',
        description: 'Select "App Limits" and tap "Add Limit"',
        icon: 'timer-outline',
      },
      {
        step: 4,
        title: 'Select Your Apps',
        description: 'Choose the apps you want to restrict (Social, Entertainment, etc.) and set a daily time limit like 1 minute.',
        icon: 'apps-outline',
      },
      {
        step: 5,
        title: 'Set a Passcode',
        description: 'Go back to Screen Time and tap "Use Screen Time Passcode". Ask someone you trust to set it so you can\'t bypass it!',
        icon: 'lock-closed-outline',
      },
    ];
  },
};

export default PermissionsManager;
