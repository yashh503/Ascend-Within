import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; 
import { Ionicons } from '@expo/vector-icons';
import Button from '../components/Button';
import Card from '../components/Card';
import { progressAPI } from '../services/api';
import { useApp } from '../context/AppContext';
import { COLORS, SPACING, FONTS, RADIUS } from '../constants/theme';

const MIN_LENGTH = 120;

const ReflectionScreen = ({ navigation }) => {
  const { fetchDailyStatus } = useApp();
  const [reflection, setReflection] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const characterCount = reflection.trim().length;
  const isValid = characterCount >= MIN_LENGTH;

  const handleSubmit = async () => {
    if (!isValid) {
      Alert.alert('Too short', `Please write at least ${MIN_LENGTH} characters.`);
      return;
    }

    setLoading(true);
    try {
      await progressAPI.submitReflection({ reflection: reflection.trim() });
      await fetchDailyStatus();
      setSubmitted(true);
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successContainer}>
          <Ionicons name="heart-outline" size={64} color={COLORS.primary} />
          <Text style={styles.successTitle}>Beautifully reflected</Text>
          <Text style={styles.successText}>
            Your thoughts have been saved. Taking time to reflect is a powerful practice.
          </Text>
          <Button
            title="Return Home"
            onPress={() => navigation.navigate('MainTabs')}
            style={styles.homeButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Card style={styles.promptCard}>
            <Text style={styles.promptQuestion}>
              How does today's reading apply to your life?
            </Text>
            <Text style={styles.promptHint}>
              Take a moment to connect the wisdom with your personal experience.
            </Text>
          </Card>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Write your reflection here..."
              placeholderTextColor={COLORS.textLight}
              multiline
              textAlignVertical="top"
              value={reflection}
              onChangeText={setReflection}
              maxLength={2000}
            />
            <View style={styles.charCount}>
              <Text style={[styles.charText, isValid && styles.charTextValid]}>
                {characterCount} / {MIN_LENGTH} characters minimum
              </Text>
              {isValid && (
                <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
              )}
            </View>
          </View>

          <Button
            title="Save Reflection"
            onPress={handleSubmit}
            loading={loading}
            disabled={!isValid}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    flexGrow: 1,
  },
  promptCard: {
    marginBottom: SPACING.lg,
    backgroundColor: COLORS.surfaceAlt,
  },
  promptQuestion: {
    ...FONTS.subheading,
    marginBottom: SPACING.sm,
  },
  promptHint: {
    ...FONTS.small,
    fontStyle: 'italic',
  },
  inputContainer: {
    marginBottom: SPACING.lg,
  },
  textInput: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontSize: 16,
    color: COLORS.text,
    minHeight: 200,
    borderWidth: 1,
    borderColor: COLORS.border,
    lineHeight: 24,
  },
  charCount: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: SPACING.sm,
  },
  charText: {
    ...FONTS.caption,
    marginRight: SPACING.xs,
  },
  charTextValid: {
    color: COLORS.success,
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  successTitle: {
    ...FONTS.heading,
    fontSize: 24,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  successText: {
    ...FONTS.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: SPACING.xl,
  },
  homeButton: {
    width: '100%',
  },
});

export default ReflectionScreen;
