import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

interface AddSenderRuleModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (senderName: string) => void;
}

export const AddSenderRuleModal: React.FC<AddSenderRuleModalProps> = ({
  visible,
  onClose,
  onSave,
}) => {
  const [senderName, setSenderName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    const trimmed = senderName.trim();
    if (!trimmed) {
      setError('Sender name cannot be empty');
      return;
    }
    onSave(trimmed.toUpperCase());
    setSenderName('');
    setError(null);
  };

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>Add Sender Rule</Text>
          <Text style={styles.description}>
            Enter the exact sender keyword found in SMS headers (e.g. HDFCBK, SBIINB, ICICIB).
          </Text>

          <TextInput
            style={styles.input}
            placeholder="e.g. HDFCBK, SBIINB, ICICIB"
            placeholderTextColor="#9CA3AF"
            autoCapitalize="characters"
            value={senderName}
            onChangeText={(txt) => {
              setSenderName(txt);
              setError(null);
            }}
            testID="sender-name-input"
          />

          {error && <Text style={styles.errorText}>{error}</Text>}

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setSenderName('');
                setError(null);
                onClose();
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
              testID="save-rule-btn"
            >
              <Text style={styles.saveButtonText}>Save Rule</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 8,
  },
  description: {
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 16,
    lineHeight: 18,
  },
  input: {
    backgroundColor: '#0F172A',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 8,
    color: '#F8FAFC',
    padding: 12,
    fontSize: 15,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 8,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#475569',
  },
  cancelButtonText: {
    color: '#CBD5E1',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
