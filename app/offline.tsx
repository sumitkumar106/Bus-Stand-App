import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function OfflineScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>📵 Offline Mode</Text>
      <Text style={styles.subtitle}>You are currently offline</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
  },
});
