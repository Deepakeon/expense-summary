import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { DatabaseRepository } from '../db/repository';
import { QuarantinedMessage } from '../db/types';

interface ReviewQueueScreenProps {
  repository: DatabaseRepository;
  onNavigateToTemplateBuilder?: (senderName: string, sampleSms: string) => void;
}

export const ReviewQueueScreen: React.FC<ReviewQueueScreenProps> = ({
  repository,
  onNavigateToTemplateBuilder,
}) => {
  const [messages, setMessages] = useState<QuarantinedMessage[]>([]);

  const loadData = useCallback(() => {
    const pending = repository.getQuarantinedMessages('pending');
    setMessages(pending);
  }, [repository]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDismiss = (id: number) => {
    repository.updateQuarantinedMessageStatus(id, 'dismissed');
    loadData();
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Review Queue</Text>
          <Text style={styles.headerSubtitle}>
            SMS messages from tracked senders that did not match extraction templates
          </Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{`${messages.length} pending`}</Text>
        </View>
      </View>

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>✨</Text>
            <Text style={styles.emptyStateTitle}>All Clear!</Text>
            <Text style={styles.emptyStateText}>
              No quarantined messages. All messages from tracked senders matched your extraction templates or have been reviewed.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card} testID={`quarantine-card-${item.id}`}>
            <View style={styles.cardHeader}>
              <Text style={styles.senderHeader}>{item.sender}</Text>
              <Text style={styles.timestampText}>{formatDate(item.received_timestamp)}</Text>
            </View>

            <View style={styles.smsBox}>
              <Text style={styles.smsText}>{item.raw_sms_body}</Text>
            </View>

            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={styles.dismissBtn}
                onPress={() => handleDismiss(item.id)}
                testID={`dismiss-btn-${item.id}`}
              >
                <Text style={styles.dismissBtnText}>Dismiss</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.tuneBtn}
                onPress={() => {
                  if (onNavigateToTemplateBuilder) {
                    onNavigateToTemplateBuilder(item.sender, item.raw_sms_body);
                  }
                }}
                testID={`tune-template-btn-${item.id}`}
              >
                <Text style={styles.tuneBtnText}>+ Create / Tune Template</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
    maxWidth: '80%',
  },
  badge: {
    backgroundColor: '#F59E0B',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  badgeText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '700',
  },
  listContainer: {
    padding: 16,
    gap: 12,
  },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  senderHeader: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  timestampText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  smsBox: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 10,
  },
  smsText: {
    color: '#E2E8F0',
    fontSize: 12,
    lineHeight: 16,
    fontFamily: 'monospace',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 4,
  },
  dismissBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#475569',
  },
  dismissBtnText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  tuneBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
  },
  tuneBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    padding: 48,
    alignItems: 'center',
  },
  emptyStateIcon: {
    fontSize: 36,
    marginBottom: 12,
  },
  emptyStateTitle: {
    color: '#F8FAFC',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptyStateText: {
    color: '#64748B',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
});
