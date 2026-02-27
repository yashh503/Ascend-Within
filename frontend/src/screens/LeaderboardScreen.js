import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context'; 
import { useFocusEffect } from '@react-navigation/native';
import Card from '../components/Card';
import { leaderboardAPI } from '../services/api';
import { COLORS, SPACING, FONTS, RADIUS, SHADOWS } from '../constants/theme';

const TABS = [
  { key: 'streak', label: 'Streak', icon: 'flame-outline' },
  { key: 'verses', label: 'Verses', icon: 'book-outline' },
  { key: 'level', label: 'Wisdom', icon: 'shield-outline' },
  { key: 'longest_streak', label: 'Best Streak', icon: 'trophy-outline' },
];

const LeaderboardScreen = () => {
  const [activeTab, setActiveTab] = useState('streak');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadLeaderboard = async (type) => {
    try {
      const response = await leaderboardAPI.getLeaderboard(type || activeTab);
      setData(response.data);
    } catch (error) {
      console.error('Failed to load leaderboard:', error.message);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadLeaderboard();
    }, [activeTab])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadLeaderboard();
    setRefreshing(false);
  };

  const switchTab = (key) => {
    setActiveTab(key);
    setLoading(true);
    loadLeaderboard(key);
  };

  const getMedalColor = (rank) => {
    if (rank === 1) return '#FFD700';
    if (rank === 2) return '#C0C0C0';
    if (rank === 3) return '#CD7F32';
    return null;
  };

  const getMedalIcon = (rank) => {
    if (rank <= 3) return 'medal-outline';
    return null;
  };

  const getValueSuffix = () => {
    switch (activeTab) {
      case 'streak':
      case 'longest_streak':
        return ' days';
      case 'verses':
        return ' verses';
      case 'level':
        return '';
      default:
        return '';
    }
  };

  if (loading && !data) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading leaderboard...</Text>
      </View>
    );
  }

  const currentUser = data?.currentUserRank;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.tabRow}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => switchTab(tab.key)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={tab.icon}
                size={16}
                color={activeTab === tab.key ? COLORS.white : COLORS.textSecondary}
              />
              <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {currentUser && (
          <Card style={styles.myRankCard}>
            <View style={styles.myRankLeft}>
              <Text style={styles.myRankLabel}>Your Rank</Text>
              <Text style={styles.myRankNumber}>#{currentUser.rank}</Text>
            </View>
            <View style={styles.myRankRight}>
              <Text style={styles.myRankValue}>
                {currentUser.value}{getValueSuffix()}
              </Text>
            </View>
          </Card>
        )}

        {data?.leaderboard?.length > 0 && (
          <View style={styles.topThree}>
            {data.leaderboard.slice(0, 3).map((entry, index) => {
              const positions = [1, 0, 2];
              const actualEntry = data.leaderboard[positions[index]];
              if (!actualEntry) return null;
              const isFirst = positions[index] === 0;
              return (
                <View
                  key={actualEntry.userId}
                  style={[styles.podiumItem, isFirst && styles.podiumFirst]}
                >
                  <View style={[styles.podiumAvatar, isFirst && styles.podiumAvatarFirst,
                    { borderColor: getMedalColor(actualEntry.rank) || COLORS.border }
                  ]}>
                    <Text style={[styles.podiumAvatarText, isFirst && styles.podiumAvatarTextFirst]}>
                      {actualEntry.name?.charAt(0)?.toUpperCase() || '?'}
                    </Text>
                  </View>
                  <Ionicons
                    name="medal"
                    size={isFirst ? 22 : 18}
                    color={getMedalColor(actualEntry.rank)}
                    style={styles.podiumMedal}
                  />
                  <Text style={styles.podiumName} numberOfLines={1}>
                    {actualEntry.isCurrentUser ? 'You' : actualEntry.name}
                  </Text>
                  <Text style={styles.podiumValue}>
                    {actualEntry.value}{getValueSuffix()}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        <View style={styles.listSection}>
          {data?.leaderboard?.slice(3).map((entry) => (
            <View
              key={entry.userId}
              style={[styles.listItem, entry.isCurrentUser && styles.listItemHighlight]}
            >
              <Text style={styles.listRank}>#{entry.rank}</Text>
              <View style={styles.listAvatar}>
                <Text style={styles.listAvatarText}>
                  {entry.name?.charAt(0)?.toUpperCase() || '?'}
                </Text>
              </View>
              <Text style={[styles.listName, entry.isCurrentUser && styles.listNameHighlight]} numberOfLines={1}>
                {entry.isCurrentUser ? 'You' : entry.name}
              </Text>
              <Text style={styles.listValue}>
                {entry.value}{getValueSuffix()}
              </Text>
            </View>
          ))}
        </View>

        {data?.leaderboard?.length === 0 && (
          <Card style={styles.emptyCard}>
            <Ionicons name="people-outline" size={48} color={COLORS.textLight} />
            <Text style={styles.emptyText}>No rankings yet. Be the first!</Text>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    ...FONTS.body,
    color: COLORS.textSecondary,
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  tabRow: {
    flexDirection: 'row',
    marginBottom: SPACING.lg,
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: RADIUS.md,
    padding: 3,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.sm,
    gap: 4,
  },
  tabActive: {
    backgroundColor: COLORS.primary,
    ...SHADOWS.small,
  },
  tabText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: COLORS.white,
  },
  myRankCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: COLORS.primary,
    marginBottom: SPACING.lg,
  },
  myRankLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  myRankLabel: {
    ...FONTS.small,
    fontWeight: '600',
    color: COLORS.primary,
  },
  myRankNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.primary,
  },
  myRankRight: {},
  myRankValue: {
    ...FONTS.title,
    color: COLORS.primary,
  },
  topThree: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginBottom: SPACING.xl,
    paddingHorizontal: SPACING.sm,
  },
  podiumItem: {
    alignItems: 'center',
    flex: 1,
    paddingTop: SPACING.md,
  },
  podiumFirst: {
    marginTop: -SPACING.md,
  },
  podiumAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  podiumAvatarFirst: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
  },
  podiumAvatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  podiumAvatarTextFirst: {
    fontSize: 22,
  },
  podiumMedal: {
    marginTop: -8,
  },
  podiumName: {
    ...FONTS.small,
    fontWeight: '600',
    marginTop: SPACING.xs,
    maxWidth: 90,
    textAlign: 'center',
  },
  podiumValue: {
    ...FONTS.tiny,
    color: COLORS.primary,
    fontWeight: '600',
  },
  listSection: {
    marginBottom: SPACING.lg,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  listItemHighlight: {
    borderColor: COLORS.primary,
    backgroundColor: '#FAF8F5',
  },
  listRank: {
    ...FONTS.body,
    fontWeight: '700',
    width: 36,
    color: COLORS.textSecondary,
  },
  listAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  listAvatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  listName: {
    ...FONTS.body,
    fontWeight: '500',
    flex: 1,
  },
  listNameHighlight: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  listValue: {
    ...FONTS.small,
    fontWeight: '600',
    color: COLORS.primary,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  emptyText: {
    ...FONTS.body,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
});

export default LeaderboardScreen;
