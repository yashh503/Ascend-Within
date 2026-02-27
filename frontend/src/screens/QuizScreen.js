import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; 
import { Ionicons } from '@expo/vector-icons';
import Button from '../components/Button';
import ProgressBar from '../components/ProgressBar';
import { progressAPI, verseAPI } from '../services/api';
import { useApp } from '../context/AppContext';
import { COLORS, SPACING, FONTS, RADIUS, SHADOWS } from '../constants/theme';

const MAX_QUIZ_QUESTIONS = 5;

const QuizScreen = ({ navigation, route }) => {
  const { fetchDailyStatus, fetchBookChapters } = useApp();
  const bookId = route.params?.bookId || 'bhagavad-gita';
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      let verses = route.params?.verses;
      if (!verses) {
        const response = await verseAPI.getSessionVerses(bookId);
        verses = response.data.verses;
      }

      const allQuestions = [];
      verses.forEach((verse) => {
        if (verse.questions) {
          verse.questions.forEach((q, idx) => {
            allQuestions.push({
              ...q,
              verseRef: `Chapter ${verse.chapter}:${verse.verseNumber}`,
              id: `${verse._id}-${idx}`,
            });
          });
        }
      });

      setQuestions(allQuestions.slice(0, MAX_QUIZ_QUESTIONS));
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const selectAnswer = (questionId, answerIndex) => {
    if (showResult) return;
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: answerIndex }));
  };

  const handleSubmit = async () => {
    if (Object.keys(selectedAnswers).length < questions.length) {
      Alert.alert('Incomplete', 'Please answer all questions before submitting.');
      return;
    }

    setSubmitting(true);
    try {
      let correct = 0;
      questions.forEach((q) => {
        if (selectedAnswers[q.id] === q.correctAnswer) {
          correct++;
        }
      });

      const response = await progressAPI.submitQuiz({
        score: correct,
        total: questions.length,
        bookId,
      });

      setResult(response.data);
      setShowResult(true);
      await Promise.all([fetchDailyStatus(), fetchBookChapters(bookId)]);
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleContinue = async () => {
    if (result?.passed) {
      navigation.navigate('Reflection', { bookId });
    } else {
      try {
        await progressAPI.resetQuiz({ bookId });
        await fetchDailyStatus();
        navigation.navigate('Reading', { bookId });
      } catch (error) {
        Alert.alert('Error', error.message);
      }
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Preparing your quiz...</Text>
      </View>
    );
  }

  if (showResult && result) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.resultContainer}>
          <View style={styles.resultIcon}>
            <Ionicons
              name={result.passed ? 'checkmark-circle' : 'close-circle'}
              size={72}
              color={result.passed ? COLORS.success : COLORS.error}
            />
          </View>
          <Text style={styles.resultTitle}>
            {result.passed ? 'Brilliant!' : 'Almost there!'}
          </Text>
          <Text style={styles.resultScore}>
            {result.score} / {result.total} correct ({result.percentage}%)
          </Text>
          <Text style={styles.resultMessage}>{result.message}</Text>

          <Button
            title={result.passed ? 'Continue' : 'Review Verses'}
            onPress={handleContinue}
            style={styles.resultButton}
          />

          {!result.passed && (
            <Button
              title="Try Quiz Again"
              variant="outline"
              onPress={() => {
                setShowResult(false);
                setSelectedAnswers({});
                setCurrentQuestion(0);
                setResult(null);
              }}
              style={styles.retryButton}
            />
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  const question = questions[currentQuestion];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.counter}>
          Question {currentQuestion + 1} of {questions.length}
        </Text>
        <ProgressBar progress={((currentQuestion + 1) / questions.length) * 100} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.verseRef}>{question.verseRef}</Text>
        <Text style={styles.questionText}>{question.question}</Text>

        {question.options.map((option, index) => {
          const isSelected = selectedAnswers[question.id] === index;
          return (
            <TouchableOpacity
              key={index}
              style={[styles.optionCard, isSelected && styles.optionSelected]}
              onPress={() => selectAnswer(question.id, index)}
              activeOpacity={0.7}
            >
              <View style={[styles.optionCircle, isSelected && styles.optionCircleSelected]}>
                {isSelected && <View style={styles.optionCircleFill} />}
              </View>
              <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                {option}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.navigation}>
        {currentQuestion > 0 ? (
          <Button
            title="Previous"
            variant="outline"
            onPress={() => setCurrentQuestion(currentQuestion - 1)}
            style={styles.navButton}
          />
        ) : (
          <View style={styles.navButton} />
        )}

        {currentQuestion < questions.length - 1 ? (
          <Button
            title="Next"
            onPress={() => setCurrentQuestion(currentQuestion + 1)}
            style={styles.navButton}
          />
        ) : (
          <Button
            title="Submit"
            onPress={handleSubmit}
            loading={submitting}
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
  },
  loadingText: {
    ...FONTS.body,
    color: COLORS.textSecondary,
  },
  topBar: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
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
  verseRef: {
    ...FONTS.caption,
    fontWeight: '600',
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.sm,
  },
  questionText: {
    ...FONTS.subheading,
    fontSize: 18,
    lineHeight: 28,
    marginBottom: SPACING.lg,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    ...SHADOWS.small,
  },
  optionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: '#FAF8F5',
  },
  optionCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.border,
    marginRight: SPACING.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionCircleSelected: {
    borderColor: COLORS.primary,
  },
  optionCircleFill: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
  },
  optionText: {
    ...FONTS.body,
    flex: 1,
  },
  optionTextSelected: {
    fontWeight: '500',
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
  resultContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  resultIcon: {
    marginBottom: SPACING.lg,
  },
  resultTitle: {
    ...FONTS.heading,
    marginBottom: SPACING.sm,
  },
  resultScore: {
    ...FONTS.subheading,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  resultMessage: {
    ...FONTS.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  resultButton: {
    width: '100%',
    marginBottom: SPACING.md,
  },
  retryButton: {
    width: '100%',
  },
});

export default QuizScreen;
