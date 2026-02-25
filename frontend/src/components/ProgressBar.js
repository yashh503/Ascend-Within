import React from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS, RADIUS } from '../constants/theme';

const ProgressBar = ({ progress, color = COLORS.primary, height = 6 }) => {
  return (
    <View style={[styles.track, { height }]}>
      <View
        style={[
          styles.fill,
          { width: `${Math.min(100, Math.max(0, progress))}%`, backgroundColor: color, height },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    backgroundColor: COLORS.border,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: RADIUS.full,
  },
});

export default ProgressBar;
