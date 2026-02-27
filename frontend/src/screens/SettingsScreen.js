import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from '../components/Card';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { COLORS, SPACING, FONTS } from '../constants/theme';

const SettingsScreen = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: logout },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Card style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.name?.charAt(0)?.toUpperCase() || '?'}
            </Text>
          </View>
          <Text style={styles.profileName}>{user?.name}</Text>
          <Text style={styles.profileEmail}>{user?.email}</Text>
        </Card>

        <Text style={styles.sectionTitle}>Practice</Text>
        <Card style={styles.settingsCard}>
          <SettingRow
            icon="book-outline"
            label="Daily Target"
            value={`${user?.dailyTarget || 1} verse${user?.dailyTarget !== 1 ? 's' : ''}`}
          />
          <SettingRow
            icon="compass-outline"
            label="Wisdom Path"
            value={user?.wisdomPath === 'hinduism' ? 'Hinduism' : 'Not set'}
          />
          <SettingRow
            icon="shield-outline"
            label="Wisdom Level"
            value={`Level ${user?.disciplineLevel || 1}`}
            last
          />
        </Card>

        <Button
          title="Sign Out"
          variant="outline"
          onPress={handleLogout}
          style={styles.logoutButton}
        />

        <Text style={styles.version}>Ascend Within v1.0.0</Text>
      </ScrollView>
    </View>
  );
};

const SettingRow = ({ icon, label, value, last }) => (
  <View style={[styles.settingRow, last && styles.lastRow]}>
    <View style={styles.settingLeft}>
      <Ionicons name={icon} size={20} color={COLORS.primary} />
      <Text style={styles.settingLabel}>{label}</Text>
    </View>
    <Text style={styles.settingValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  profileCard: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.white,
  },
  profileName: {
    ...FONTS.title,
    marginBottom: 2,
  },
  profileEmail: {
    ...FONTS.small,
  },
  sectionTitle: {
    ...FONTS.caption,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    marginLeft: SPACING.xs,
  },
  settingsCard: {
    padding: 0,
    marginBottom: SPACING.lg,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingLabel: {
    ...FONTS.body,
    fontSize: 15,
    marginLeft: SPACING.md,
  },
  settingValue: {
    ...FONTS.small,
    fontWeight: '500',
    color: COLORS.primary,
  },
  logoutButton: {
    marginBottom: SPACING.md,
  },
  version: {
    ...FONTS.tiny,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
});

export default SettingsScreen;
