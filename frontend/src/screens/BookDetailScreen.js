import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import Card from '../components/Card';
import ProgressBar from '../components/ProgressBar';
import { useApp } from '../context/AppContext';
import { COLORS, SPACING, FONTS, RADIUS, SHADOWS } from '../constants/theme';

const BookDetailScreen = ({ navigation, route }) => {
  const bookId = route.params?.bookId || 'bhagavad-gita';
  const { bookData, fetchBookChapters } = useApp();
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchBookChapters(bookId).finally(() => setInitialLoading(false));
    }, [bookId])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchBookChapters(bookId);
    setRefreshing(false);
  };

  const handleChapterPress = (chapter) => {
    if (chapter.status === 'locked') return;

    if (!bookData?.setupComplete) {
      navigation.navigate('BookSetup', {
        bookId,
        bookName: bookData?.book?.name,
      });
      return;
    }

    if (chapter.status === 'in_progress' || chapter.status === 'unlocked') {
      navigation.navigate('Reading', { bookId });
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return { name: 'checkmark-circle', color: COLORS.success };
      case 'in_progress': return { name: 'play-circle', color: COLORS.primary };
      case 'unlocked': return { name: 'lock-open-outline', color: COLORS.accent };
      case 'locked': return { name: 'lock-closed-outline', color: COLORS.textLight };
      default: return { name: 'ellipse-outline', color: COLORS.textLight };
    }
  };

  const totalVersesRead = bookData?.totalVersesRead || 0;
  const totalVerses = bookData?.book?.totalVerses || 0;
  const overallProgress = totalVerses > 0 ? (totalVersesRead / totalVerses) * 100 : 0;

  if (initialLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.bookCard}>
          <Text style={styles.bookTitle}>{bookData?.book?.name || ''}</Text>
          <View style={styles.bookProgressRow}>
            <Text style={styles.bookProgressText}>
              {totalVersesRead} / {totalVerses} verses
            </Text>
            <Text style={styles.bookProgressPercent}>{Math.round(overallProgress)}%</Text>
          </View>
          <ProgressBar progress={overallProgress} />
        </Card>

        <Text style={styles.sectionTitle}>Chapters</Text>

        {bookData?.chapters?.map((chapter) => {
          const icon = getStatusIcon(chapter.status);
          const isActive = chapter.status === 'in_progress' || chapter.status === 'unlocked';
          const isLocked = chapter.status === 'locked';
          const chapterProgress = chapter.verseCount > 0
            ? (chapter.versesRead / chapter.verseCount) * 100
            : 0;

          return (
            <TouchableOpacity
              key={chapter.chapter}
              style={[styles.chapterCard, isLocked && styles.chapterCardLocked]}
              onPress={() => handleChapterPress(chapter)}
              activeOpacity={isLocked ? 1 : 0.7}
            >
              <View style={[styles.chapterIcon, { backgroundColor: isLocked ? COLORS.surfaceAlt : `${icon.color}15` }]}>
                <Ionicons name={icon.name} size={22} color={icon.color} />
              </View>
              <View style={styles.chapterInfo}>
                <View style={styles.chapterHeader}>
                  <Text style={[styles.chapterNumber, isLocked && styles.chapterTextLocked]}>
                    Chapter {chapter.chapter}
                  </Text>
                  <Text style={[styles.chapterVerseCount, isLocked && styles.chapterTextLocked]}>
                    {chapter.versesRead}/{chapter.verseCount}
                  </Text>
                </View>
                <Text style={[styles.chapterName, isLocked && styles.chapterTextLocked]} numberOfLines={1}>
                  {chapter.name}
                </Text>
                {(chapter.status === 'in_progress' || chapter.status === 'completed') && (
                  <View style={styles.chapterProgressBar}>
                    <View style={[styles.chapterProgressFill, { width: `${chapterProgress}%` }]} />
                  </View>
                )}
              </View>
              {isActive && (
                <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
              )}
            </TouchableOpacity>
          );
        })}
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
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  bookCard: {
    marginBottom: SPACING.lg,
  },
  bookTitle: {
    ...FONTS.title,
    marginBottom: SPACING.sm,
  },
  bookProgressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  bookProgressText: {
    ...FONTS.small,
  },
  bookProgressPercent: {
    ...FONTS.small,
    fontWeight: '600',
    color: COLORS.primary,
  },
  sectionTitle: {
    ...FONTS.subheading,
    marginBottom: SPACING.md,
  },
  chapterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.small,
  },
  chapterCardLocked: {
    opacity: 0.5,
  },
  chapterIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  chapterInfo: {
    flex: 1,
  },
  chapterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chapterNumber: {
    ...FONTS.small,
    fontWeight: '600',
    color: COLORS.text,
  },
  chapterVerseCount: {
    ...FONTS.tiny,
  },
  chapterName: {
    ...FONTS.small,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  chapterTextLocked: {
    color: COLORS.textLight,
  },
  chapterProgressBar: {
    height: 3,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    marginTop: SPACING.xs,
    overflow: 'hidden',
  },
  chapterProgressFill: {
    height: '100%',
    backgroundColor: COLORS.success,
    borderRadius: 2,
  },
});

export default BookDetailScreen;
