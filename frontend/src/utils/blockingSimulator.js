import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * App Blocking Simulator
 *
 * In a production Android app, this would use:
 * - UsageStatsManager for foreground app detection
 * - AccessibilityService for real-time monitoring
 * - SYSTEM_ALERT_WINDOW for overlay display
 *
 * Since Expo doesn't support system-level blocking,
 * this module simulates the logic for demonstration purposes.
 */

const BLOCKED_APPS_KEY = 'blocked_apps';
const UNLOCK_EXPIRY_KEY = 'unlock_expiry';

export const BlockingSimulator = {
  async setRestrictedApps(apps) {
    await AsyncStorage.setItem(BLOCKED_APPS_KEY, JSON.stringify(apps));
  },

  async getRestrictedApps() {
    const apps = await AsyncStorage.getItem(BLOCKED_APPS_KEY);
    return apps ? JSON.parse(apps) : [];
  },

  async setUnlockExpiry(expiryTimestamp) {
    await AsyncStorage.setItem(UNLOCK_EXPIRY_KEY, expiryTimestamp.toString());
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

  async shouldBlockApp(packageName) {
    const restrictedApps = await this.getRestrictedApps();
    if (!restrictedApps.includes(packageName)) return false;
    const unlocked = await this.isUnlocked();
    return !unlocked;
  },

  async simulateForegroundCheck(packageName) {
    const shouldBlock = await this.shouldBlockApp(packageName);
    return {
      isBlocked: shouldBlock,
      packageName,
      reason: shouldBlock
        ? 'Complete your daily wisdom task to unlock this app.'
        : 'App is accessible.',
    };
  },

  async clearUnlock() {
    await AsyncStorage.removeItem(UNLOCK_EXPIRY_KEY);
  },
};

export default BlockingSimulator;
