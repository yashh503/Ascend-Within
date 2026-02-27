import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Card from '../components/Card';
import Button from '../components/Button';
import ProgressBar from '../components/ProgressBar';
import { verseAPI } from '../services/api';
import { COLORS, SPACING, FONTS, RADIUS } from '../constants/theme';

const BonusReadingScreen = ({ navigation }) => {
  const [verses, setVerses] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);

  useEffect(() => {
    loadBonusVerses();
  }, []);

  const loadBonusVerses = async () => {
    try {
      const response = await verseAPI.getBonusVerses();
      setVerses(response.data.verses);
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const goToNext = () => {
    if (currentIndex < verses.length - 1) {
      setCurrentIndex(currentIndex + 1);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    }
  };

  const goToPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading more wisdom...</Text>
      </View>
    );
  }

  const verse = verses[currentIndex];

  if (!verse) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>No more verses available right now.</Text>
        <Button
          title="Go Back"
          onPress={() => navigation.goBack()}
          style={{ marginTop: SPACING.lg }}
        />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.bonusBadge}>Bonus Reading</Text>
        <Text style={styles.counter}>
          Verse {currentIndex + 1} of {verses.length}
        </Text>
        <ProgressBar progress={((currentIndex + 1) / verses.length) * 100} />
      </View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.chapterBadge}>
          <Text style={styles.chapterText}>
            Chapter {verse.chapter}, Verse {verse.verseNumber}
          </Text>
        </Card>

        <Card style={styles.sanskritCard}>
          <Text style={styles.sanskritText}>{verse.sanskrit}</Text>
        </Card>

        {verse.transliteration ? (
          <Card style={styles.contentCard}>
            <Text style={styles.sectionLabel}>Transliteration</Text>
            <Text style={styles.translationText}>{verse.transliteration}</Text>
          </Card>
        ) : null}

        {verse.translation ? (
          <Card style={styles.contentCard}>
            <Text style={styles.sectionLabel}>Translation</Text>
            <Text style={styles.translationText}>{verse.translation}</Text>
          </Card>
        ) : null}

        {verse.wordMeanings ? (
          <Card style={styles.contentCard}>
            <Text style={styles.sectionLabel}>Word Meanings</Text>
            <Text style={styles.explanationText}>{verse.wordMeanings}</Text>
          </Card>
        ) : null}

        {verse.explanation ? (
          <Card style={styles.contentCard}>
            <Text style={styles.sectionLabel}>Explanation</Text>
            <Text style={styles.explanationText}>{verse.explanation}</Text>
          </Card>
        ) : null}
      </ScrollView>

      <View style={styles.navigation}>
        {currentIndex > 0 ? (
          <Button
            title="Previous"
            variant="outline"
            onPress={goToPrev}
            style={styles.navButton}
          />
        ) : (
          <View style={styles.navButton} />
        )}

        {currentIndex < verses.length - 1 ? (
          <Button
            title="Next"
            onPress={goToNext}
            style={styles.navButton}
          />
        ) : (
          <Button
            title="Done"
            onPress={() => navigation.goBack()}
            style={styles.navButton}
          />
        )}
      </View>
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
    paddingHorizontal: SPACING.lg,
  },
  loadingText: {
    ...FONTS.body,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
    textAlign: 'center',
  },
  topBar: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  bonusBadge: {
    ...FONTS.caption,
    fontWeight: '600',
    color: COLORS.success,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.xs,
  },
  counter: {
    ...FONTS.small,
    fontWeight: '500',
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  chapterBadge: {
    alignSelf: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.surfaceAlt,
    marginBottom: SPACING.lg,
  },
  chapterText: {
    ...FONTS.small,
    fontWeight: '600',
    color: COLORS.primary,
  },
  sanskritCard: {
    marginBottom: SPACING.md,
    backgroundColor: '#FFFDF7',
    borderWidth: 1,
    borderColor: '#EDE8DB',
  },
  sanskritText: {
    fontSize: 18,
    lineHeight: 32,
    color: COLORS.text,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  contentCard: {
    marginBottom: SPACING.md,
  },
  sectionLabel: {
    ...FONTS.caption,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: COLORS.primary,
    marginBottom: SPACING.sm,
  },
  translationText: {
    ...FONTS.body,
    lineHeight: 26,
  },
  explanationText: {
    ...FONTS.body,
    lineHeight: 26,
    color: COLORS.textSecondary,
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  navButton: {
    flex: 1,
    marginHorizontal: SPACING.xs,
  },
});

export default BonusReadingScreen;
