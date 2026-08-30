import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DatabaseRepository } from '../db/repository';
import { BatchSyncService } from '../sync/syncService';
import { ISmsReader } from '../sms/types';
import { smsReader as defaultSmsReader } from '../sms/smsReader';
import { DashboardScreen } from '../screens/DashboardScreen';
import { TransactionsScreen } from '../screens/TransactionsScreen';
import { ReviewQueueScreen } from '../screens/ReviewQueueScreen';
import { SenderRulesScreen } from '../screens/SenderRulesScreen';

export type ActiveTab = 'dashboard' | 'transactions' | 'review' | 'rules';

interface AppShellProps {
  repository: DatabaseRepository;
  syncService: BatchSyncService;
  smsReader?: ISmsReader;
}

export const AppShell: React.FC<AppShellProps> = ({
  repository,
  syncService,
  smsReader = defaultSmsReader,
}) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [pendingQuarantineCount, setPendingQuarantineCount] = useState<number>(0);
  const [rulesPrefill, setRulesPrefill] = useState<{ sender?: string; sampleSms?: string }>({});

  const refreshBadge = useCallback(() => {
    const pending = repository.getQuarantinedMessages('pending');
    setPendingQuarantineCount(pending.length);
  }, [repository]);

  useEffect(() => {
    refreshBadge();
    smsReader.hasPermissions().then((granted) => {
      if (!granted) {
        smsReader.requestPermissions();
      }
    });
  }, [refreshBadge, smsReader]);

  const handleNavigateToTemplateBuilder = (sender: string, sampleSms: string) => {
    setRulesPrefill({ sender, sampleSms });
    setActiveTab('rules');
  };

  const handleTabChange = (tab: ActiveTab) => {
    if (tab !== 'rules') {
      setRulesPrefill({});
    }
    setActiveTab(tab);
    refreshBadge();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {activeTab === 'dashboard' && (
          <DashboardScreen
            repository={repository}
            syncService={syncService}
            smsReader={smsReader}
            onNavigateToTransactions={() => handleTabChange('transactions')}
          />
        )}
        {activeTab === 'transactions' && (
          <TransactionsScreen repository={repository} />
        )}
        {activeTab === 'review' && (
          <ReviewQueueScreen
            repository={repository}
            onNavigateToTemplateBuilder={handleNavigateToTemplateBuilder}
          />
        )}
        {activeTab === 'rules' && (
          <SenderRulesScreen
            repository={repository}
            initialSender={rulesPrefill.sender}
            initialSampleSms={rulesPrefill.sampleSms}
          />
        )}
      </View>

      {/* Bottom Tab Navigation Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'dashboard' && styles.tabItemActive]}
          onPress={() => handleTabChange('dashboard')}
          testID="tab-dashboard"
        >
          <Text
            style={[
              styles.tabLabel,
              activeTab === 'dashboard' && styles.tabLabelActive,
            ]}
          >
            Dashboard
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'transactions' && styles.tabItemActive]}
          onPress={() => handleTabChange('transactions')}
          testID="tab-transactions"
        >
          <Text
            style={[
              styles.tabLabel,
              activeTab === 'transactions' && styles.tabLabelActive,
            ]}
          >
            Transactions
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'review' && styles.tabItemActive]}
          onPress={() => handleTabChange('review')}
          testID="tab-review-queue"
        >
          <View style={styles.reviewTabContent}>
            <Text
              style={[
                styles.tabLabel,
                activeTab === 'review' && styles.tabLabelActive,
              ]}
            >
              Review
            </Text>
            {pendingQuarantineCount > 0 && (
              <View style={styles.badgePill}>
                <Text style={styles.badgePillText}>{pendingQuarantineCount}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'rules' && styles.tabItemActive]}
          onPress={() => handleTabChange('rules')}
          testID="tab-rules"
        >
          <Text
            style={[
              styles.tabLabel,
              activeTab === 'rules' && styles.tabLabelActive,
            ]}
          >
            Sender Rules
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  content: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: 8,
  },
  tabItemActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
  },
  tabLabel: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  tabLabelActive: {
    color: '#38BDF8',
    fontWeight: '700',
  },
  reviewTabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  badgePill: {
    backgroundColor: '#F59E0B',
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  badgePillText: {
    color: '#000000',
    fontSize: 10,
    fontWeight: '800',
  },
});
