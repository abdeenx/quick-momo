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
  Modal,
  FlatList,
  ScrollView,
} from 'react-native';
import * as Contacts from 'expo-contacts';
import { Ionicons } from '@expo/vector-icons';
import { useSettings } from '../../context/SettingsContext';

interface ContactItem {
  id: string;
  name: string;
  phoneNumbers?: string[];
}

export default function HomeScreen() {
  const [phoneOrCode, setPhoneOrCode] = useState('');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [contactsModalVisible, setContactsModalVisible] = useState(false);
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const { numberFormat, codeFormat } = useSettings();

  const formatPhoneNumber = (number: string): string => {
    let cleaned = number.replace(/[\s\-\(\)]/g, '');
    
    if (cleaned.startsWith('+')) {
      const restOfNumber = cleaned.substring(4);
      cleaned = '0' + restOfNumber;
    }
    
    return cleaned;
  };

  const loadContacts = async () => {
    setIsLoading(true);
    
    try {
      const { status, canAskAgain } = await Contacts.requestPermissionsAsync();
      
      if (status === 'granted') {
        try {
          const result = await Contacts.getContactsAsync({
            fields: [Contacts.Fields.PhoneNumbers],
          });
          
          if (result.data && result.data.length > 0) {
            const formattedContacts: ContactItem[] = result.data
              .filter(contact => contact.phoneNumbers && contact.phoneNumbers.length > 0)
              .map(contact => ({
                id: contact.id || String(Math.random()),
                name: contact.name || 'Unknown',
                phoneNumbers: contact.phoneNumbers?.map(p => p.number || '').filter(Boolean) || [],
              }));
            
            if (formattedContacts.length > 0) {
              setContacts(formattedContacts);
              setContactsModalVisible(true);
            } else {
              Alert.alert('No Contacts', 'No contacts with phone numbers found.');
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

  const selectContact = (contact: ContactItem, phoneNumber: string) => {
    const formattedNumber = formatPhoneNumber(phoneNumber);
    setPhoneOrCode(formattedNumber);
    setContactsModalVisible(false);
    setSearchQuery('');
  };

  const filteredContacts = contacts.filter(contact => 
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.phoneNumbers?.some(phone => phone.includes(searchQuery))
  );

  const renderContactItem = ({ item }: { item: ContactItem }) => (
    <View style={styles.contactItem}>
      <Text style={styles.contactName}>{item.name}</Text>
      {item.phoneNumbers?.map((phone, index) => (
        <TouchableOpacity
          key={`${item.id}-${index}`}
          style={styles.phoneNumberButton}
          onPress={() => selectContact(item, phone)}
        >
          <Text style={styles.phoneNumberText}>{phone}</Text>
          <Ionicons name="checkmark-circle" size={20} color="#007AFF" />
        </TouchableOpacity>
      ))}
    </View>
  );

  const dialUSSD = async (ussdCode: string) => {
    let url: string;
    
    if (Platform.OS === 'ios') {
      url = `tel:${encodeURIComponent(ussdCode)}`;
    } else {
      const encodedCode = ussdCode.replace(/#/g, encodeURIComponent('#'));
      url = `tel:${encodedCode}`;
    }
    
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Cannot open dialer on this device/emulator.');
      }
    } catch (error) {
      console.log('Dial error:', error);
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
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.card}>
        <Text style={styles.label}>Phone Number or Code</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={phoneOrCode}
            onChangeText={setPhoneOrCode}
            placeholder="Enter phone number or code"
            keyboardType="phone-pad"
          />
          {phoneOrCode.length > 0 && (
            <TouchableOpacity 
              style={styles.clearButton} 
              onPress={() => setPhoneOrCode('')}
            >
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            style={[styles.contactButton, isLoading && styles.contactButtonDisabled]} 
            onPress={loadContacts}
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
        <View style={styles.amountInputContainer}>
          <TextInput
            style={[styles.input, styles.amountInput]}
            value={amount}
            onChangeText={setAmount}
            placeholder="Enter amount"
            keyboardType="numeric"
          />
          {amount.length > 0 && (
            <TouchableOpacity 
              style={styles.clearButtonAmount} 
              onPress={() => setAmount('')}
            >
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={handlePayToNumber}>
            <Text style={styles.buttonText}>Pay to Number</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={handlePayToCode}>
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>Pay to Code</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Contact Picker Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={contactsModalVisible}
        onRequestClose={() => {
          setContactsModalVisible(false);
          setSearchQuery('');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Contact</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => {
                  setContactsModalVisible(false);
                  setSearchQuery('');
                }}
              >
                <Ionicons name="close" size={28} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search contacts..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color="#999" />
                </TouchableOpacity>
              )}
            </View>

            <FlatList
              data={filteredContacts}
              keyExtractor={(item) => item.id}
              renderItem={renderContactItem}
              style={styles.contactsList}
              showsVerticalScrollIndicator={true}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>
                    {searchQuery ? 'No contacts found matching your search' : 'No contacts available'}
                  </Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>
    </ScrollView>
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
  amountInputContainer: {
    position: 'relative',
  },
  clearButtonAmount: {
    position: 'absolute',
    right: 12,
    top: 14,
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
  clearButton: {
    position: 'absolute',
    right: 56,
    padding: 4,
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '80%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 12,
    height: 44,
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  contactsList: {
    flex: 1,
  },
  contactItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  phoneNumberButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    marginTop: 4,
  },
  phoneNumberText: {
    fontSize: 15,
    color: '#007AFF',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
});