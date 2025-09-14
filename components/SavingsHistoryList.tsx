/**
 * Budget Buddy Mobile - Savings History List Component
 * @license MIT
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { formatCurrency } from '../utils/currencyUtils';
import type { SavingsEntry } from '../services/databaseService';

interface SavingsHistoryListProps {
  entries: SavingsEntry[];
  onLoadMore?: () => void;
  isLoading?: boolean;
  style?: any;
  maxItems?: number;
  showFilter?: boolean;
}

export default function SavingsHistoryList({ 
  entries, 
  onLoadMore, 
  isLoading = false,
  style,
  maxItems,
  showFilter = true
}: SavingsHistoryListProps) {
  const [filter, setFilter] = useState<'all' | 'deposit' | 'withdrawal'>('all');

  // Filter entries based on selected filter
  const filteredEntries = entries.filter(entry => {
    if (filter === 'all') return true;
    return entry.entry_type === filter;
  });

  // Limit entries if maxItems is specified
  const displayEntries = maxItems 
    ? filteredEntries.slice(0, maxItems) 
    : filteredEntries;

  const getEntryIcon = (entryType: string) => {
    switch (entryType) {
      case 'deposit':
        return '💰';
      case 'withdrawal':
        return '💸';
      case 'adjustment':
        return '⚖️';
      case 'transfer':
        return '🔄';
      default:
        return '💱';
    }
  };

  const getEntryColor = (entryType: string) => {
    switch (entryType) {
      case 'deposit':
        return '#4CAF50';
      case 'withdrawal':
        return '#F44336';
      case 'adjustment':
        return '#FF9800';
      case 'transfer':
        return '#2196F3';
      default:
        return '#666';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    
    return date.toLocaleDateString();
  };

  const renderEntry = ({ item, index }: { item: SavingsEntry; index: number }) => (
    <View style={[styles.entryItem, index === displayEntries.length - 1 && styles.lastItem]}>
      <View style={styles.entryLeft}>
        <Text style={styles.entryIcon}>{getEntryIcon(item.entry_type)}</Text>
        <View style={styles.entryInfo}>
          <Text style={styles.entryLabel}>
            {item.label || `${item.entry_type.charAt(0).toUpperCase() + item.entry_type.slice(1)}`}
          </Text>
          {item.purpose && (
            <Text style={styles.entryPurpose}>{item.purpose}</Text>
          )}
          <Text style={styles.entryDate}>
            {formatDate(item.date_entered)}
          </Text>
        </View>
      </View>
      <View style={styles.entryRight}>
        <Text style={[
          styles.entryAmount,
          { color: getEntryColor(item.entry_type) }
        ]}>
          {item.entry_type === 'deposit' ? '+' : '-'}{formatCurrency(Math.abs(item.amount))}
        </Text>
        {!item.synced && (
          <View style={styles.syncIndicator}>
            <Text style={styles.syncText}>⏳</Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderFilter = () => (
    <View style={styles.filterContainer}>
      <TouchableOpacity
        style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
        onPress={() => setFilter('all')}
      >
        <Text style={[styles.filterButtonText, filter === 'all' && styles.filterButtonTextActive]}>
          All
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.filterButton, filter === 'deposit' && styles.filterButtonActive]}
        onPress={() => setFilter('deposit')}
      >
        <Text style={[styles.filterButtonText, filter === 'deposit' && styles.filterButtonTextActive]}>
          💰 Deposits
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.filterButton, filter === 'withdrawal' && styles.filterButtonActive]}
        onPress={() => setFilter('withdrawal')}
      >
        <Text style={[styles.filterButtonText, filter === 'withdrawal' && styles.filterButtonTextActive]}>
          💸 Withdrawals
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateIcon}>📝</Text>
      <Text style={styles.emptyStateText}>
        {filter === 'all' 
          ? 'No transactions yet' 
          : `No ${filter}s yet`
        }
      </Text>
      <Text style={styles.emptyStateSubtext}>
        {filter === 'all'
          ? 'Add your first savings entry to get started!'
          : `Start tracking your ${filter}s here.`
        }
      </Text>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.title}>Transaction History</Text>
      {entries.length > 0 && (
        <Text style={styles.subtitle}>
          {filteredEntries.length} {filteredEntries.length === 1 ? 'transaction' : 'transactions'}
          {filter !== 'all' && ` (${filter}s)`}
        </Text>
      )}
    </View>
  );

  return (
    <View style={[styles.container, style]}>
      {renderHeader()}
      {showFilter && entries.length > 0 && renderFilter()}
      
      {displayEntries.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={displayEntries}
          renderItem={renderEntry}
          keyExtractor={(item, index) => item.id?.toString() || index.toString()}
          showsVerticalScrollIndicator={false}
          onEndReached={onLoadMore}
          onEndReachedThreshold={0.5}
          scrollEnabled={!maxItems}
          style={styles.list}
        />
      )}

      {maxItems && entries.length > maxItems && (
        <TouchableOpacity style={styles.loadMoreButton} onPress={onLoadMore}>
          <Text style={styles.loadMoreText}>
            View All {entries.length} Transactions
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  header: {
    padding: 20,
    paddingBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  filterButtonActive: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196F3',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#2196F3',
    fontWeight: '600',
  },
  list: {
    paddingHorizontal: 20,
  },
  entryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  entryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  entryIcon: {
    fontSize: 28,
    marginRight: 16,
  },
  entryInfo: {
    flex: 1,
  },
  entryLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  entryPurpose: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  entryDate: {
    fontSize: 12,
    color: '#999',
  },
  entryRight: {
    alignItems: 'flex-end',
  },
  entryAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  syncIndicator: {
    backgroundColor: '#FFF3CD',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  syncText: {
    fontSize: 10,
    color: '#856404',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 20,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  loadMoreButton: {
    padding: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fafafa',
  },
  loadMoreText: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '600',
  },
});
