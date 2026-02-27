import { Linking, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';

const PermissionsManager = {

  async checkNotificationStatus() {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      return status === 'granted';
    } catch {
      return false;
    }
  },

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
          body: 'Your daily verses are waiting. Start your reading!',
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

  async requestPermission(key) {
    if (key === 'notifications') {
      return await this.requestNotifications();
    }
    return false;
  },

  getPermissionInfo() {
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
};

export default PermissionsManager;
