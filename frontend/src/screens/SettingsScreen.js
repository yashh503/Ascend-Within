import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; 
import { Ionicons } from '@expo/vector-icons';
import Card from '../components/Card';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';
import PermissionsManager from '../utils/permissionsManager';
import BlockingService from '../utils/blockingSimulator';
import { COLORS, SPACING, FONTS, RADIUS } from '../constants/theme';

const SettingsScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [blockingEnabled, setBlockingEnabled] = useState(true);
  const [permissionStatus, setPermissionStatus] = useState({});

  useEffect(() => {
    loadPermissionStatus();
    loadBlockingState();
  }, []);

  const loadPermissionStatus = async () => {
    // refreshStatus re-checks real OS notification permission
    const status = await PermissionsManager.refreshStatus();
    setPermissionStatus(status);
  };

  const loadBlockingState = async () => {
    const enabled = await BlockingService.isBlockingEnabled();
    setBlockingEnabled(enabled);
  };

  const handleBlockingToggle = async (value) => {
    setBlockingEnabled(value);
    await BlockingService.setBlockingEnabled(value);
  };

  const handleFixPermission = async (key) => {
    await PermissionsManager.requestPermission(key);
    // For settings-based permissions, re-check after a short delay
    // (user needs to come back from settings)
    setTimeout(async () => {
      await loadPermissionStatus();
    }, 1000);
    await loadPermissionStatus();
  };

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

  const handleTestBlock = () => {
    navigation.navigate('Blocked');
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

        <Text style={styles.sectionTitle}>Discipline</Text>
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
            label="Discipline Level"
            value={`Level ${user?.disciplineLevel || 1}`}
          />
          <SettingRow
            icon="apps-outline"
            label="Restricted Apps"
            value={`${user?.restrictedApps?.length || 0} apps`}
            last
          />
        </Card>

        <Text style={styles.sectionTitle}>App Blocking</Text>
        <Card style={styles.settingsCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="lock-closed-outline" size={20} color={COLORS.primary} />
              <Text style={styles.settingLabel}>Blocking Enabled</Text>
            </View>
            <Switch
              value={blockingEnabled}
              onValueChange={handleBlockingToggle}
              trackColor={{ false: COLORS.border, true: COLORS.primaryLight }}
              thumbColor={blockingEnabled ? COLORS.primary : COLORS.textLight}
            />
          </View>
          <TouchableOpacity style={[styles.settingRow, styles.lastRow]} onPress={handleTestBlock}>
            <View style={styles.settingLeft}>
              <Ionicons name="eye-outline" size={20} color={COLORS.primary} />
              <Text style={styles.settingLabel}>Test Block Screen</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
          </TouchableOpacity>
        </Card>

        <Text style={styles.sectionTitle}>Permissions</Text>
        <Card style={styles.settingsCard}>
          {PermissionsManager.getPermissionInfo().map((perm, index, arr) => {
            const isGranted = permissionStatus[perm.key];
            return (
              <TouchableOpacity
                key={perm.key}
                style={[styles.settingRow, index === arr.length - 1 && styles.lastRow]}
                onPress={() => !isGranted && handleFixPermission(perm.key)}
                disabled={isGranted}
                activeOpacity={isGranted ? 1 : 0.7}
              >
                <View style={styles.settingLeft}>
                  <Ionicons
                    name={perm.icon}
                    size={20}
                    color={isGranted ? COLORS.success : COLORS.error}
                  />
                  <Text style={styles.settingLabel}>{perm.title}</Text>
                </View>
                {isGranted ? (
                  <View style={styles.permStatusRow}>
                    <Text style={styles.permGrantedText}>Enabled</Text>
                    <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
                  </View>
                ) : (
                  <View style={styles.permStatusRow}>
                    <Text style={styles.permFixText}>{perm.actionLabel || 'Fix'}</Text>
                    <Ionicons name="chevron-forward" size={16} color={COLORS.error} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </Card>

        {Platform.OS === 'ios' && (
          <>
            <Text style={styles.sectionTitle}>Screen Time</Text>
            <Card style={styles.settingsCard}>
              <TouchableOpacity
                style={[styles.settingRow]}
                onPress={() => Linking.openURL('app-settings:')}
                activeOpacity={0.7}
              >
                <View style={styles.settingLeft}>
                  <Ionicons name="hourglass-outline" size={20} color={COLORS.primary} />
                  <Text style={styles.settingLabel}>Open Screen Time Settings</Text>
                </View>
                <Ionicons name="open-outline" size={18} color={COLORS.textLight} />
              </TouchableOpacity>
              <View style={[styles.settingRow, styles.lastRow]}>
                <View style={styles.settingLeft}>
                  <Ionicons name="information-circle-outline" size={20} color={COLORS.textLight} />
                  <Text style={[styles.settingLabel, { color: COLORS.textSecondary, fontSize: 13 }]}>
                    Use iOS Screen Time to set app limits natively
                  </Text>
                </View>
              </View>
            </Card>
          </>
        )}

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
  infoCard: {
    backgroundColor: COLORS.surfaceAlt,
    marginBottom: SPACING.lg,
  },
  infoText: {
    ...FONTS.small,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 20,
  },
  permStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  permGrantedText: {
    ...FONTS.small,
    color: COLORS.success,
    fontWeight: '500',
  },
  permFixText: {
    ...FONTS.small,
    color: COLORS.error,
    fontWeight: '600',
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
