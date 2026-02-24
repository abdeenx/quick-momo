import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Linking,
  Platform,
  ActivityIndicator,
} from 'react-native';
import * as Contacts from 'expo-contacts';
import { Ionicons } from '@expo/vector-icons';
import { useSettings } from '../../context/SettingsContext';

export default function HomeScreen() {
  const [phoneOrCode, setPhoneOrCode] = useState('');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { numberFormat, codeFormat } = useSettings();

  const formatPhoneNumber = (number: string): string => {
    let cleaned = number.replace(/[\s\-\(\)]/g, '');
    
    if (cleaned.startsWith('+')) {
      const restOfNumber = cleaned.substring(4);
      cleaned = '0' + restOfNumber;
    }
    
    return cleaned;
  };

  const pickContact = async () => {
    setIsLoading(true);
    
    try {
      const { status, canAskAgain } = await Contacts.requestPermissionsAsync();
      
      if (status === 'granted') {
        try {
          const result = await Contacts.getContactsAsync({
            fields: [Contacts.Fields.PhoneNumbers],
          });
          
          if (result.data && result.data.length > 0) {
            const contact = result.data[0];
            if (contact.phoneNumbers && contact.phoneNumbers.length > 0) {
              const number = contact.phoneNumbers[0].number || '';
              const formattedNumber = formatPhoneNumber(number);
              setPhoneOrCode(formattedNumber);
              Alert.alert('Success', `Selected: ${contact.name || 'Unknown'}`);
            } else {
              Alert.alert('No Phone Number', 'This contact does not have a phone number.');
            }
          } else {
            Alert.alert(
              'No Contacts Found', 
              Platform.OS === 'ios' 
                ? 'No contacts found. Please add contacts in the Contacts app on your simulator/device.'
                : 'No contacts found on this device.'
            );
          }
        } catch (contactError) {
          console.error('Error fetching contacts:', contactError);
          Alert.alert('Error', 'Failed to fetch contacts. Please try again.');
        }
      } else {
        if (!canAskAgain) {
          Alert.alert(
            'Permission Required',
            'Contacts permission is required to select contacts. Please enable it in Settings.',
            [
              { text: 'Cancel', style: 'cancel' },
              { 
                text: 'Open Settings', 
                onPress: () => {
                  if (Platform.OS === 'ios') {
                    Linking.openURL('app-settings:');
                  } else {
                    Linking.openSettings();
                  }
                }
              }
            ]
          );
        } else {
          Alert.alert(
            'Permission Denied', 
            'Please grant contacts permission to select a contact.'
          );
        }
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
      Alert.alert('Error', 'Failed to request contacts permission.');
    } finally {
      setIsLoading(false);
    }
  };

  const dialUSSD = async (ussdCode: string) => {
    const encodedCode = encodeURIComponent(ussdCode);
    const url = Platform.OS === 'ios' ? `tel:${encodedCode}` : `tel:${ussdCode}`;
    
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Cannot open dialer on this device.');
      }
    } catch {
      Alert.alert('Error', 'Failed to open dialer.');
    }
  };

  const handlePayToNumber = () => {
    if (!phoneOrCode || !amount) {
      Alert.alert('Error', 'Please enter both phone number/code and amount.');
      return;
    }
    
    const ussdCode = numberFormat
      .replace('{number}', phoneOrCode)
      .replace('{amount}', amount)
      .replace('{code}', phoneOrCode);
    
    dialUSSD(ussdCode);
  };

  const handlePayToCode = () => {
    if (!phoneOrCode || !amount) {
      Alert.alert('Error', 'Please enter both code and amount.');
      return;
    }
    
    const ussdCode = codeFormat
      .replace('{code}', phoneOrCode)
      .replace('{amount}', amount)
      .replace('{number}', phoneOrCode);
    
    dialUSSD(ussdCode);
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.label}>Phone Number or Code</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={phoneOrCode}
            onChangeText={setPhoneOrCode}
            placeholder="Enter phone number or code"
            keyboardType="phone-pad"
            autoFocus
          />
          <TouchableOpacity 
            style={[styles.contactButton, isLoading && styles.contactButtonDisabled]} 
            onPress={pickContact}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : (
              <Ionicons name="person" size={20} color="#007AFF" />
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Amount</Text>
        <TextInput
          style={[styles.input, styles.amountInput]}
          value={amount}
          onChangeText={setAmount}
          placeholder="Enter amount"
          keyboardType="numeric"
        />

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={handlePayToNumber}>
            <Text style={styles.buttonText}>Pay to Number</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={handlePayToCode}>
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>Pay to Code</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    padding: 16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  input: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: '#FAFAFA',
  },
  amountInput: {
    marginBottom: 24,
  },
  contactButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  contactButtonDisabled: {
    opacity: 0.5,
  },
  buttonContainer: {
    gap: 12,
  },
  button: {
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  secondaryButton: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  secondaryButtonText: {
    color: '#007AFF',
  },
});
