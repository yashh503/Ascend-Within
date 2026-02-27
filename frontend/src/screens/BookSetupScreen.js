import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Button from '../components/Button';
import { verseAPI } from '../services/api';
import { COLORS, SPACING, FONTS, RADIUS, SHADOWS } from '../constants/theme';

const PACE_OPTIONS = [
  {
    section: 'Chapter-based',
    options: [
      { value: 'half_chapter', label: 'Half Chapter', desc: 'Read half a chapter per session' },
      { value: 'full_chapter', label: 'Full Chapter', desc: 'Complete one chapter per session' },
    ],
  },
  {
    section: 'Custom',
    options: [
      { value: 'custom_5', label: '5 verses', desc: 'Gentle pace — great for beginners' },
      { value: 'custom_10', label: '10 verses', desc: 'Steady pace — build a strong habit' },
      { value: 'custom_15', label: '15 verses', desc: 'Committed — for dedicated readers' },
      { value: 'custom_20', label: '20 verses', desc: 'Intensive — deep daily immersion' },
    ],
  },
];

const BookSetupScreen = ({ navigation, route }) => {
  const { bookId, bookName } = route.params;
  const [selectedPace, setSelectedPace] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!selectedPace) return;
    setLoading(true);
    try {
      await verseAPI.setupBook(bookId, { dailyTarget: selectedPace });
      navigation.replace('Reading', { bookId });
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Set Your Pace</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.bookName}>{bookName || 'Bhagavad Gita'}</Text>
        <Text style={styles.description}>
          Choose how much you'd like to read each session. You can change this anytime.
        </Text>

        {PACE_OPTIONS.map((section) => (
          <View key={section.section} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.section}</Text>
            {section.options.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[styles.paceCard, selectedPace === option.value && styles.paceCardSelected]}
                onPress={() => setSelectedPace(option.value)}
                activeOpacity={0.7}
              >
                <View style={styles.paceInfo}>
                  <Text style={styles.paceLabel}>{option.label}</Text>
                  <Text style={styles.paceDesc}>{option.desc}</Text>
                </View>
                {selectedPace === option.value && (
                  <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Start Reading"
          onPress={handleConfirm}
          disabled={!selectedPace}
          loading={loading}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  backButton: {
    padding: SPACING.xs,
  },
  headerTitle: {
    ...FONTS.title,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  bookName: {
    ...FONTS.heading,
    marginBottom: SPACING.xs,
  },
  description: {
    ...FONTS.body,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    ...FONTS.small,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.sm,
  },
  paceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.sm,
    borderWidth: 2,
    borderColor: COLORS.border,
    ...SHADOWS.small,
  },
  paceCardSelected: {
    borderColor: COLORS.primary,
  },
  paceInfo: {
    flex: 1,
  },
  paceLabel: {
    ...FONTS.title,
    marginBottom: 2,
  },
  paceDesc: {
    ...FONTS.small,
  },
  footer: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
    paddingTop: SPACING.sm,
  },
});

export default BookSetupScreen;
