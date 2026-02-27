import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import Button from '../components/Button';
import { COLORS, SPACING, FONTS } from '../constants/theme';

const WelcomeScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.icon}>🪷</Text>
          <Text style={styles.title}>Ascend Within</Text>
          <Text style={styles.subtitle}>
            Grow through ancient wisdom.{'\n'}
            One verse at a time.
          </Text>
        </View>

        <View style={styles.features}>
          <FeatureItem text="Discover sacred verses daily" />
          <FeatureItem text="Test your understanding with quizzes" />
          <FeatureItem text="Reflect and deepen your practice" />
          <FeatureItem text="Compete on the leaderboard" />
        </View>

        <View style={styles.actions}>
          <Button
            title="Get Started"
            onPress={() => navigation.navigate('Signup')}
          />
          <Button
            title="I already have an account"
            variant="outline"
            onPress={() => navigation.navigate('Login')}
            style={{ marginTop: SPACING.md }}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const FeatureItem = ({ text }) => (
  <View style={styles.featureItem}>
    <View style={styles.featureDot} />
    <Text style={styles.featureText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    justifyContent: 'space-between',
    paddingTop: SPACING.xxl,
    paddingBottom: SPACING.xl,
  },
  hero: {
    alignItems: 'center',
    marginTop: SPACING.xxl,
  },
  icon: {
    fontSize: 64,
    marginBottom: SPACING.lg,
  },
  title: {
    ...FONTS.heading,
    fontSize: 36,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  subtitle: {
    ...FONTS.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
  },
  features: {
    paddingHorizontal: SPACING.lg,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  featureDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginRight: SPACING.md,
  },
  featureText: {
    ...FONTS.body,
    color: COLORS.text,
  },
  actions: {
    marginTop: SPACING.xl,
  },
});

export default WelcomeScreen;
