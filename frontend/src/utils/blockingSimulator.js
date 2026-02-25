import { NativeModules, NativeEventEmitter, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

const { AppBlockerModule } = NativeModules;

const BLOCKING_ENABLED_KEY = 'blocking_enabled';
const RESTRICTED_APPS_KEY = 'blocked_apps';
const UNLOCK_EXPIRY_KEY = 'unlock_expiry';

/**
 * App Blocking Service
 *
 * ANDROID (dev build):
 *   Uses native AppBlockerModule with UsageStatsManager to detect
 *   when a restricted app is opened. Polls every 1.5s, and when
 *   a restricted app is in foreground → brings our app to front
 *   and emits "onAppBlocked" event → we navigate to BlockedScreen.
 *
 * iOS:
 *   Uses Screen Time (configured during onboarding).
 *   We only provide notification reminders.
 *
 * FALLBACK (Expo Go / no native module):
 *   AppState-based detection with cooldown (previous behavior).
 */

const hasNativeModule = Platform.OS === 'android' && AppBlockerModule != null;

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

const BlockingService = {
  _listener: null,
  _eventEmitter: null,
  _eventSubscription: null,
  _onBlockedCallback: null,
  _appStateListener: null,

  // ─── Start Monitoring ──────────────────────────────

  async startMonitoring(onBlocked) {
    this._onBlockedCallback = onBlocked;

    if (hasNativeModule) {
      await this._startNativeMonitoring();
    } else if (Platform.OS === 'ios') {
      // iOS: no background monitoring needed, Screen Time handles it
      // Just set up notification reminders
    }
    // No fallback AppState blocking — it doesn't work properly in Expo Go
  },

  async _startNativeMonitoring() {
    try {
      // Load restricted apps into native module
      const apps = await this.getRestrictedApps();
      if (apps.length > 0) {
        await AppBlockerModule.setRestrictedApps(apps);
      }

      // Sync blocking state
      const enabled = await this.isBlockingEnabled();
      await AppBlockerModule.setBlockingEnabled(enabled);

      // Sync unlock expiry
      const expiry = await AsyncStorage.getItem(UNLOCK_EXPIRY_KEY);
      if (expiry) {
        await AppBlockerModule.setUnlockExpiry(new Date(expiry).getTime());
      }

      // Listen for "onAppBlocked" events from native
      this._eventEmitter = new NativeEventEmitter(AppBlockerModule);
      this._eventSubscription = this._eventEmitter.addListener(
        'onAppBlocked',
        (event) => {
          if (this._onBlockedCallback) {
            this._onBlockedCallback(event.blockedApp);
          }
        }
      );

      // Start native polling
      await AppBlockerModule.startMonitoring();
    } catch (error) {
      console.warn('BlockingService: Failed to start native monitoring:', error.message);
    }
  },

  // ─── Stop Monitoring ───────────────────────────────

  async stopMonitoring() {
    this._onBlockedCallback = null;

    if (this._eventSubscription) {
      this._eventSubscription.remove();
      this._eventSubscription = null;
    }

    if (hasNativeModule) {
      try { await AppBlockerModule.stopMonitoring(); } catch (_) {}
    }

    if (this._appStateListener) {
      this._appStateListener.remove();
      this._appStateListener = null;
    }
  },

  // Kept for AppNavigator compatibility
  setOnTaskScreen(_isOnTask) {},

  // ─── Permission Checks (Android native) ────────────

  async hasUsageStatsPermission() {
    if (!hasNativeModule) return false;
    try {
      return await AppBlockerModule.hasUsageStatsPermission();
    } catch {
      return false;
    }
  },

  async openUsageStatsSettings() {
    if (!hasNativeModule) return;
    try {
      await AppBlockerModule.openUsageStatsSettings();
    } catch (_) {}
  },

  async hasOverlayPermission() {
    if (!hasNativeModule) return false;
    try {
      return await AppBlockerModule.hasOverlayPermission();
    } catch {
      return false;
    }
  },

  async openOverlaySettings() {
    if (!hasNativeModule) return;
    try {
      await AppBlockerModule.openOverlaySettings();
    } catch (_) {}
  },

  // ─── Check if native module is available ───────────

  isNativeBlockingAvailable() {
    return hasNativeModule;
  },

  // ─── Blocking toggle ──────────────────────────────

  async isBlockingEnabled() {
    const val = await AsyncStorage.getItem(BLOCKING_ENABLED_KEY);
    return val !== 'false';
  },

  async setBlockingEnabled(enabled) {
    await AsyncStorage.setItem(BLOCKING_ENABLED_KEY, enabled.toString());
    if (hasNativeModule) {
      try { await AppBlockerModule.setBlockingEnabled(enabled); } catch (_) {}
    }
    if (!enabled) {
      await this._clearBlockingNotification();
    }
  },

  // ─── Restricted apps ──────────────────────────────

  async setRestrictedApps(apps) {
    await AsyncStorage.setItem(RESTRICTED_APPS_KEY, JSON.stringify(apps));
    if (hasNativeModule) {
      try { await AppBlockerModule.setRestrictedApps(apps); } catch (_) {}
    }
  },

  async getRestrictedApps() {
    const apps = await AsyncStorage.getItem(RESTRICTED_APPS_KEY);
    return apps ? JSON.parse(apps) : [];
  },

  // ─── Unlock management ────────────────────────────

  async setUnlockExpiry(expiryTimestamp) {
    await AsyncStorage.setItem(UNLOCK_EXPIRY_KEY, expiryTimestamp.toString());
    if (hasNativeModule) {
      try {
        await AppBlockerModule.setUnlockExpiry(new Date(expiryTimestamp).getTime());
      } catch (_) {}
    }
    await this._clearBlockingNotification();
  },

  async isUnlocked() {
    const expiry = await AsyncStorage.getItem(UNLOCK_EXPIRY_KEY);
    if (!expiry) return false;
    return new Date(expiry) > new Date();
  },

  async getUnlockMinutesRemaining() {
    const expiry = await AsyncStorage.getItem(UNLOCK_EXPIRY_KEY);
    if (!expiry) return 0;
    const remaining = new Date(expiry) - new Date();
    return Math.max(0, Math.floor(remaining / 1000 / 60));
  },

  async clearUnlock() {
    await AsyncStorage.removeItem(UNLOCK_EXPIRY_KEY);
  },

  // ─── Notification helpers ──────────────────────────

  async _showBlockingNotification() {
    if (Platform.OS !== 'android') return;
    const enabled = await this.isBlockingEnabled();
    if (!enabled) return;
    const unlocked = await this.isUnlocked();
    if (unlocked) return;

    try {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') return;

      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Apps are restricted',
          body: 'Complete your daily wisdom reading and quiz to unlock your apps.',
          sticky: true,
          priority: 'high',
        },
        trigger: null,
        identifier: 'blocking-reminder',
      });
    } catch (_) {}
  },

  async _clearBlockingNotification() {
    try {
      await Notifications.dismissNotificationAsync('blocking-reminder');
    } catch (_) {}
  },
};

export { BlockingService };
export default BlockingService;
