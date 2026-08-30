import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Switch,
  StyleSheet,
  Alert,
} from 'react-native';
import { DatabaseRepository } from '../db/repository';
import { Category, ExtractionTemplate, SenderRule } from '../db/types';
import { AddSenderRuleModal } from '../components/AddSenderRuleModal';
import { TemplateBuilderModal } from '../components/TemplateBuilderModal';

interface SenderRulesScreenProps {
  repository: DatabaseRepository;
  initialSampleSms?: string;
  initialSender?: string;
}

export const SenderRulesScreen: React.FC<SenderRulesScreenProps> = ({
  repository,
  initialSampleSms,
  initialSender,
}) => {
  const [rules, setRules] = useState<SenderRule[]>([]);
  const [templatesMap, setTemplatesMap] = useState<Record<number, ExtractionTemplate[]>>({});
  const [categories, setCategories] = useState<Category[]>([]);
  const [showAddRuleModal, setShowAddRuleModal] = useState(false);
  const [activeRuleForTemplate, setActiveRuleForTemplate] = useState<SenderRule | null>(null);
  const [sampleSmsForTemplate, setSampleSmsForTemplate] = useState<string | undefined>(initialSampleSms);

  const loadData = useCallback(() => {
    const loadedRules = repository.getSenderRules();
    setRules(loadedRules);

    const map: Record<number, ExtractionTemplate[]> = {};
    for (const rule of loadedRules) {
      map[rule.id] = repository.getTemplatesForSender(rule.id);
    }
    setTemplatesMap(map);
    setCategories(repository.getCategories());
  }, [repository]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (initialSender && !activeRuleForTemplate) {
      const existing = rules.find(
        (r) => r.sender_name.toLowerCase() === initialSender.toLowerCase()
      );
      if (existing) {
        setActiveRuleForTemplate(existing);
        setSampleSmsForTemplate(initialSampleSms);
      }
    }
  }, [initialSender, initialSampleSms, rules, activeRuleForTemplate]);

  const handleToggleRule = (id: number, value: boolean) => {
    repository.toggleSenderRule(id, value);
    loadData();
  };

  const handleDeleteRule = (id: number) => {
    repository.deleteSenderRule(id);
    loadData();
  };

  const handleAddRule = (senderName: string) => {
    try {
      repository.createSenderRule(senderName);
      setShowAddRuleModal(false);
      loadData();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create sender rule');
    }
  };

  const handleSaveTemplate = (data: {
    templatePattern: string;
    transactionType: 'debit' | 'credit';
    defaultCategoryId?: number | null;
  }) => {
    if (!activeRuleForTemplate) return;
    try {
      repository.createExtractionTemplate({
        sender_rule_id: activeRuleForTemplate.id,
        template_pattern: data.templatePattern,
        transaction_type: data.transactionType,
        default_category_id: data.defaultCategoryId,
      });
      setActiveRuleForTemplate(null);
      setSampleSmsForTemplate(undefined);
      loadData();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save template');
    }
  };

  const handleDeleteTemplate = (templateId: number) => {
    repository.deleteExtractionTemplate(templateId);
    loadData();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Sender Rules</Text>
          <Text style={styles.headerSubtitle}>
            Configure financial SMS senders & visual templates
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addRuleButton}
          onPress={() => setShowAddRuleModal(true)}
        >
          <Text style={styles.addRuleButtonText}>+ Add Sender Rule</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={rules}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>No Sender Rules Configured</Text>
            <Text style={styles.emptyStateText}>
              Add sender rules (e.g. HDFCBK, SBIINB) to start tracking transactions from your bank SMS messages.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const templates = templatesMap[item.id] || [];
          return (
            <View style={styles.ruleCard}>
              <View style={styles.ruleCardHeader}>
                <View style={styles.ruleInfo}>
                  <Text style={styles.ruleName}>{item.sender_name}</Text>
                  <Text style={styles.templateCount}>
                    {templates.length} {templates.length === 1 ? 'template' : 'templates'} configured
                  </Text>
                </View>
                <View style={styles.ruleActions}>
                  <Switch
                    value={item.is_active === 1}
                    onValueChange={(val) => handleToggleRule(item.id, val)}
                    trackColor={{ false: '#334155', true: '#2563EB' }}
                    thumbColor={item.is_active === 1 ? '#60A5FA' : '#94A3B8'}
                    testID={`rule-toggle-${item.id}`}
                  />
                  <TouchableOpacity
                    onPress={() => handleDeleteRule(item.id)}
                    style={styles.deleteButton}
                  >
                    <Text style={styles.deleteButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Templates List */}
              {templates.length > 0 && (
                <View style={styles.templatesContainer}>
                  {templates.map((tpl) => (
                    <View key={tpl.id} style={styles.templateItem}>
                      <View style={styles.templateDetails}>
                        <View style={styles.templateBadgeRow}>
                          <Text
                            style={[
                              styles.typeBadge,
                              tpl.transaction_type === 'debit'
                                ? styles.debitBadge
                                : styles.creditBadge,
                            ]}
                          >
                            {tpl.transaction_type.toUpperCase()}
                          </Text>
                          {tpl.default_category_id && (
                            <Text style={styles.categoryBadge}>
                              {categories.find((c) => c.id === tpl.default_category_id)?.name || 'Category'}
                            </Text>
                          )}
                        </View>
                        <Text style={styles.templatePatternText} numberOfLines={2}>
                          {tpl.template_pattern}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => handleDeleteTemplate(tpl.id)}
                        style={styles.deleteTemplateBtn}
                      >
                        <Text style={styles.deleteTemplateBtnText}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              <TouchableOpacity
                style={styles.addTemplateButton}
                onPress={() => {
                  setActiveRuleForTemplate(item);
                  setSampleSmsForTemplate(undefined);
                }}
              >
                <Text style={styles.addTemplateButtonText}>+ Add Extraction Template</Text>
              </TouchableOpacity>
            </View>
          );
        }}
      />

      <AddSenderRuleModal
        visible={showAddRuleModal}
        onClose={() => setShowAddRuleModal(false)}
        onSave={handleAddRule}
      />

      <TemplateBuilderModal
        visible={!!activeRuleForTemplate}
        senderRule={activeRuleForTemplate}
        categories={categories}
        initialSampleSms={sampleSmsForTemplate}
        onClose={() => {
          setActiveRuleForTemplate(null);
          setSampleSmsForTemplate(undefined);
        }}
        onSave={handleSaveTemplate}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
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
  },
  addRuleButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  addRuleButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
  listContainer: {
    padding: 16,
    gap: 12,
  },
  ruleCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  ruleCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ruleInfo: {
    flex: 1,
  },
  ruleName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  templateCount: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  ruleActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteButton: {
    padding: 6,
  },
  deleteButtonText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: 'bold',
  },
  templatesContainer: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 10,
    gap: 8,
  },
  templateItem: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  templateDetails: {
    flex: 1,
    marginRight: 8,
  },
  templateBadgeRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 4,
  },
  typeBadge: {
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  debitBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    color: '#F87171',
  },
  creditBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    color: '#34D399',
  },
  categoryBadge: {
    fontSize: 10,
    backgroundColor: '#334155',
    color: '#CBD5E1',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  templatePatternText: {
    color: '#E2E8F0',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  deleteTemplateBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  deleteTemplateBtnText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '600',
  },
  addTemplateButton: {
    marginTop: 12,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#334155',
  },
  addTemplateButtonText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyStateTitle: {
    color: '#CBD5E1',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  emptyStateText: {
    color: '#64748B',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
});
