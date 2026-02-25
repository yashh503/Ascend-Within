import { Platform, Linking, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

const PERMISSIONS_KEY = 'app_permissions_status';

/**
 * Permissions Manager
 *
 * Handles platform-specific permission flows:
 *
 * ANDROID:
 *   Real system permissions opened via Linking.sendIntent:
 *   1. Usage Stats Access — detect foreground app
 *   2. Accessibility Service — real-time app monitoring
 *   3. Display Over Apps (Overlay) — show blocking screen
 *
 * iOS:
 *   Apple does not allow third-party app blocking, so we:
 *   1. Request real Notification permission via expo-notifications
 *      (daily reminders to complete wisdom tasks)
 *   2. Guide user step-by-step through iOS Screen Time setup
 *      so they can set native app limits themselves
 */

const ANDROID_INTENTS = {
  usage: 'android.settings.USAGE_ACCESS_SETTINGS',
  accessibility: 'android.settings.ACCESSIBILITY_SETTINGS',
  overlay: 'android.settings.action.MANAGE_OVERLAY_PERMISSION',
};

const PermissionsManager = {

  // ─── State persistence ─────────────────────────────────

  async getPermissionStatus() {
    try {
      const stored = await AsyncStorage.getItem(PERMISSIONS_KEY);
      if (stored) return JSON.parse(stored);
    } catch (_) { /* ignore */ }

    return {
      notifications: false,
      screenTime: false,
      usage: false,
      accessibility: false,
      overlay: false,
      platform: Platform.OS,
    };
  },

  async _save(status) {
    status.platform = Platform.OS;
    await AsyncStorage.setItem(PERMISSIONS_KEY, JSON.stringify(status));
  },

  // ─── Notification permission (both platforms) ──────────

  async requestNotifications() {
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') return true;

    const { status } = await Notifications.requestPermissionsAsync();
    if (status === 'granted') {
      await this._scheduleDailyReminder();
      return true;
    }

    Alert.alert(
      'Notifications Disabled',
      'Without notifications you won\'t get daily reminders. You can enable them later in Settings.',
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
    } catch (_) { /* silent */ }
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

  // ─── Android permission openers ───────────────────────

  async _openAndroidSetting(intentKey, fallbackMessage) {
    try {
      await Linking.sendIntent(ANDROID_INTENTS[intentKey]);
      return true;
    } catch {
      try {
        await Linking.openSettings();
        return true;
      } catch {
        Alert.alert('Manual Setup Required', fallbackMessage);
        return false;
      }
    }
  },

  // ─── Unified request ──────────────────────────────────

  async requestPermission(key) {
    const status = await this.getPermissionStatus();
    let granted = false;

    if (key === 'notifications') {
      granted = await this.requestNotifications();
    } else if (key === 'screenTime') {
      granted = await this.openScreenTimeSettings();
    } else if (Platform.OS === 'android') {
      const messages = {
        usage:
          'Go to Settings > Apps > Special access > Usage access and enable Ascend Within.',
        accessibility:
          'Go to Settings > Accessibility and enable the Ascend Within service.',
        overlay:
          'Go to Settings > Apps > Special access > Display over other apps and enable Ascend Within.',
      };
      granted = await this._openAndroidSetting(key, messages[key]);
    }

    if (granted) {
      status[key] = true;
      await this._save(status);
    }
    return granted;
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
    return s.usage && s.accessibility && s.overlay;
  },

  async checkNotificationStatus() {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
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

    return [
      {
        key: 'usage',
        icon: 'time-outline',
        title: 'Usage Access',
        description: 'Track which apps you open to enforce blocking',
        actionLabel: 'Grant',
        required: true,
      },
      {
        key: 'accessibility',
        icon: 'accessibility-outline',
        title: 'Accessibility Service',
        description: 'Detect when restricted apps are opened in real-time',
        actionLabel: 'Grant',
        required: true,
      },
      {
        key: 'overlay',
        icon: 'layers-outline',
        title: 'Display Over Apps',
        description: 'Show blocking screen when restricted apps are opened',
        actionLabel: 'Grant',
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
