import { NativeModules, NativeEventEmitter, Platform, AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

const { AppBlockerModule } = NativeModules;

const BLOCKING_ENABLED_KEY = 'blocking_enabled';
const RESTRICTED_APPS_KEY = 'blocked_apps';
const UNLOCK_EXPIRY_KEY = 'unlock_expiry';

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
  _eventEmitter: null,
  _eventSubscription: null,
  _onBlockedCallback: null,
  _serviceStarted: false,
  _appStateSubscription: null,
  _monitoringInitialized: false,

  // ─── Start Monitoring ──────────────────────────────

  async startMonitoring(onBlocked) {
    // Prevent double initialization
    if (this._monitoringInitialized) {
      console.log('[BlockingService] Already initialized, updating callback only');
      this._onBlockedCallback = onBlocked;
      return;
    }

    this._onBlockedCallback = onBlocked;
    this._monitoringInitialized = true;

    if (hasNativeModule) {
      await this._startNativeMonitoring();
    } else {
      console.warn('[BlockingService] Native module not available');
    }
  },

  async _startNativeMonitoring() {
    try {
      // 1. Set up event listener FIRST so we don't miss any events
      this._eventEmitter = new NativeEventEmitter(AppBlockerModule);
      this._eventSubscription = this._eventEmitter.addListener(
        'onAppBlocked',
        (event) => {
          console.log('[BlockingService] onAppBlocked event received:', event?.blockedApp);
          if (this._onBlockedCallback) {
            console.log('[BlockingService] Calling onBlocked callback');
            this._onBlockedCallback(event?.blockedApp || 'unknown');
          } else {
            console.warn('[BlockingService] No callback registered!');
          }
        }
      );
      console.log('[BlockingService] Event listener registered');

      // 2. Load and sync restricted apps to native
      const apps = await this.getRestrictedApps();
      console.log('[BlockingService] Restricted apps from AsyncStorage:', apps);

      if (apps.length > 0) {
        await AppBlockerModule.setRestrictedApps(apps);
        console.log('[BlockingService] Synced', apps.length, 'apps to native');
      } else {
        console.warn('[BlockingService] No restricted apps found in AsyncStorage!');
      }

      // 3. Sync blocking state
      const enabled = await this.isBlockingEnabled();
      await AppBlockerModule.setBlockingEnabled(enabled);
      console.log('[BlockingService] Blocking enabled:', enabled);

      // 4. Sync unlock expiry
      const expiry = await AsyncStorage.getItem(UNLOCK_EXPIRY_KEY);
      if (expiry) {
        const expiryMs = parseInt(expiry, 10) || new Date(expiry).getTime();
        if (!isNaN(expiryMs) && expiryMs > 0) {
          await AppBlockerModule.setUnlockExpiry(expiryMs);
        }
      }

      // 5. Start the foreground service
      if (enabled && apps.length > 0) {
        try {
          await AppBlockerModule.startMonitoring();
          this._serviceStarted = true;
          console.log('[BlockingService] Foreground service STARTED');
        } catch (serviceError) {
          console.warn('[BlockingService] Service start failed:', serviceError.message);
        }
      } else {
        console.log('[BlockingService] Skipping service start: enabled=' + enabled + ' apps=' + apps.length);
      }

      // 6. Set up AppState fallback listener
      this._setupAppStateFallback();

    } catch (error) {
      console.warn('[BlockingService] _startNativeMonitoring error:', error.message);
    }
  },

  _setupAppStateFallback() {
    if (this._appStateSubscription) return;

    let lastState = AppState.currentState;

    this._appStateSubscription = AppState.addEventListener('change', async (nextState) => {
      if (lastState.match(/inactive|background/) && nextState === 'active') {
        console.log('[BlockingService] App came to foreground (AppState fallback)');
        // The native onHostResume should handle emitting "onAppBlocked".
        // This is a safety net: if pending flags weren't cleared, nudge the check.
        if (this._onBlockedCallback && this._serviceStarted && hasNativeModule) {
          try {
            // Check if there's a pending block that wasn't emitted
            const fg = await AppBlockerModule.getForegroundApp();
            console.log('[BlockingService] AppState fallback — fg app:', fg);
            // If we're the foreground (service brought us back), the native
            // onHostResume event should have already fired. No action needed here.
          } catch (_) {}
        }
      }
      lastState = nextState;
    });
  },

  // ─── Stop Monitoring ───────────────────────────────

  async stopMonitoring() {
    this._onBlockedCallback = null;
    this._serviceStarted = false;
    this._monitoringInitialized = false;

    if (this._eventSubscription) {
      this._eventSubscription.remove();
      this._eventSubscription = null;
    }

    if (this._appStateSubscription) {
      this._appStateSubscription.remove();
      this._appStateSubscription = null;
    }

    if (hasNativeModule) {
      try { await AppBlockerModule.stopMonitoring(); } catch (_) {}
    }
  },

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
      try {
        await AppBlockerModule.setRestrictedApps(apps);
        console.log('[BlockingService] setRestrictedApps synced to native:', apps.length, 'apps');

        // If service hasn't started yet but we now have apps and a callback, start it
        if (apps.length > 0 && !this._serviceStarted) {
          const enabled = await this.isBlockingEnabled();
          if (enabled) {
            try {
              await AppBlockerModule.startMonitoring();
              this._serviceStarted = true;
              console.log('[BlockingService] Service auto-started after setRestrictedApps');
            } catch (e) {
              console.warn('[BlockingService] Auto-start failed:', e.message);
            }
          }
        }
      } catch (e) {
        console.warn('[BlockingService] setRestrictedApps native sync failed:', e.message);
      }
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
        const ms = parseInt(expiryTimestamp, 10) || new Date(expiryTimestamp).getTime();
        if (!isNaN(ms) && ms > 0) {
          await AppBlockerModule.setUnlockExpiry(ms);
        }
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
