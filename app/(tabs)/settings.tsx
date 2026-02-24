import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useSettings } from '../../context/SettingsContext';

export default function SettingsScreen() {
  const { numberFormat, codeFormat, setNumberFormat, setCodeFormat } = useSettings();

  const handleReset = () => {
    Alert.alert(
      'Reset to Defaults',
      'Are you sure you want to reset all settings to default values?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            setNumberFormat('*182*1*1*{number}*{amount}#');
            setCodeFormat('*182*8*1*{code}*{amount}#');
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>USSD Code Formats</Text>
        <Text style={styles.description}>
          Customize the USSD codes used for payments. Use {'{number}'} for phone number and {'{amount}'} for the amount value.
        </Text>

        <View style={styles.section}>
          <Text style={styles.label}>Pay to Number Format</Text>
          <Text style={styles.hint}>Default: *182*1*1*{'{number}'}*{'{amount}'}#</Text>
          <TextInput
            style={styles.input}
            value={numberFormat}
            onChangeText={setNumberFormat}
            placeholder="*182*1*1*{number}*{amount}#"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Pay to Code Format</Text>
          <Text style={styles.hint}>Default: *182*8*1*{'{code}'}*{'{amount}'}#</Text>
          <TextInput
            style={styles.input}
            value={codeFormat}
            onChangeText={setCodeFormat}
            placeholder="*182*8*1*{code}*{amount}#"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      </View>

      <View style={styles.previewCard}>
        <Text style={styles.previewTitle}>Current Codes</Text>
        
        <View style={styles.previewItem}>
          <Text style={styles.previewLabel}>Pay to Number:</Text>
          <Text style={styles.previewCode}>{numberFormat}</Text>
        </View>

        <View style={styles.previewItem}>
          <Text style={styles.previewLabel}>Pay to Code:</Text>
          <Text style={styles.previewCode}>{codeFormat}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
        <Text style={styles.resetButtonText}>Reset to Defaults</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  card: {
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    lineHeight: 20,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  hint: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: '#FAFAFA',
    fontFamily: 'monospace',
  },
  previewCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  previewItem: {
    marginBottom: 12,
  },
  previewLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  previewCode: {
    fontSize: 14,
    color: '#007AFF',
    fontFamily: 'monospace',
    backgroundColor: '#F2F2F7',
    padding: 8,
    borderRadius: 4,
  },
  resetButton: {
    backgroundColor: '#FF3B30',
    marginHorizontal: 16,
    marginBottom: 32,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resetButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});