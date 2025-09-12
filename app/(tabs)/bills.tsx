/**
 * Budget Buddy Mobile - Bills Management
 * @license MIT
 */
import React, { useState } from 'react'; 
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Alert } from 'react-native'; 
import { useBillsStore } from '../../stores/billsStore'; 
import { formatCurrency } from '../../utils/currencyUtils'; 
import { logger } from '../../utils/logger';
import type { Bill } from '../../stores/billsStore';
  
export default function Bills() { 
  const { bills, monthlyTotal, addBill, updateBill, deleteBill } = useBillsStore(); 
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [actionsModalVisible, setActionsModalVisible] = useState(false);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [showArchivedBills, setShowArchivedBills] = useState(false);
  const [newBill, setNewBill] = useState({
    name: '',
    amount: '',
    dueDay: '',
    category: 'utilities' as const,
  });
  const [editBill, setEditBill] = useState({
    name: '',
    amount: '',
    dueDay: '',
    category: 'utilities' as Bill['category'],
  });

  const handleAddBill = () => { 
    setAddModalVisible(true);
  }; 

  const handleSaveBill = async () => {
    if (!newBill.name || !newBill.amount || !newBill.dueDay) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const amount = parseFloat(newBill.amount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    const dueDayNumber = parseInt(newBill.dueDay);
    if (isNaN(dueDayNumber) || dueDayNumber < 1 || dueDayNumber > 31) {
      Alert.alert('Error', 'Please enter a valid due day (1-31)');
      return;
    }

    try {
      await addBill({
        id: Date.now().toString(),
        name: newBill.name,
        amount,
        dueDay: dueDayNumber,
        category: newBill.category,
        isRecurring: true,
      });

      setNewBill({ name: '', amount: '', dueDay: '', category: 'utilities' });
      setAddModalVisible(false);
      Alert.alert('Success', 'Bill added successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to add bill. Please try again.');
    }
  };

  const handleCancel = () => {
    setNewBill({ name: '', amount: '', dueDay: '', category: 'utilities' });
    setAddModalVisible(false);
  };

  const handleBillPress = (bill: Bill) => {
    logger.debug('Bill clicked', { billName: bill.name, billId: bill.id });
    setSelectedBill(bill);
    setActionsModalVisible(true);
  };

  const handleEditBill = () => {
    if (selectedBill) {
      setEditBill({
        name: selectedBill.name,
        amount: selectedBill.amount.toString(),
        dueDay: selectedBill.dueDay.toString(),
        category: selectedBill.category,
      });
      setActionsModalVisible(false);
      setEditModalVisible(true);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedBill || !editBill.name || !editBill.amount || !editBill.dueDay) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const amount = parseFloat(editBill.amount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    const dueDayNumber = parseInt(editBill.dueDay);
    if (isNaN(dueDayNumber) || dueDayNumber < 1 || dueDayNumber > 31) {
      Alert.alert('Error', 'Please enter a valid due day (1-31)');
      return;
    }

    try {
      await updateBill(selectedBill.id, {
        name: editBill.name,
        amount,
        dueDay: dueDayNumber,
        category: editBill.category,
      });

      setEditModalVisible(false);
      setSelectedBill(null);
      Alert.alert('Success', 'Bill updated successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to update bill. Please try again.');
    }
  };

  const handleArchiveBill = async () => {
    if (!selectedBill) return;

    logger.debug('Archive button clicked for bill', { billName: selectedBill.name });

    // Temporarily skip Alert for web testing
    try {
      logger.debug('Archiving bill', { billId: selectedBill.id });
      await updateBill(selectedBill.id, { isArchived: true });
      logger.debug('Bill archived successfully');
      setActionsModalVisible(false);
      setSelectedBill(null);
      // Alert.alert('Success', 'Bill archived successfully!');
    } catch (error) {
      logger.error('Error archiving bill', { error, billId: selectedBill.id });
      // Alert.alert('Error', 'Failed to archive bill. Please try again.');
    }
  };

  const handleDeleteBill = async () => {
    if (!selectedBill) return;

    logger.debug('Delete button clicked for bill', { billName: selectedBill.name });

    // Temporarily skip Alert for web testing
    try {
      logger.debug('Deleting bill', { billId: selectedBill.id });
      await deleteBill(selectedBill.id);
      logger.debug('Bill deleted successfully');
      setActionsModalVisible(false);
      setSelectedBill(null);
      // Alert.alert('Success', 'Bill deleted successfully!');
    } catch (error) {
      logger.error('Error deleting bill', { error, billId: selectedBill.id });
      // Alert.alert('Error', 'Failed to delete bill. Please try again.');
    }
  };

  // Filter bills into active and archived
  const activeBills = bills.filter(bill => !bill.isArchived);
  const archivedBills = bills.filter(bill => bill.isArchived);
  const activeMonthlyTotal = activeBills.reduce((total, bill) => total + bill.amount, 0);

  // Development debug logging
  if (__DEV__) {
    logger.debug('Bills component render', {
      totalBills: bills.length,
      activeBills: activeBills.length,
      archivedBills: archivedBills.length
    });
  }
  
  return ( 
    <View style={styles.container}> 
      <ScrollView style={styles.scrollView}> 
        <Text style={styles.title}>Bills Tracker</Text> 
        
        {/* Enhanced Summary Section */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>📊 Bills Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Monthly Total:</Text>
            <Text style={styles.summaryValue}>{formatCurrency(activeMonthlyTotal)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Bills:</Text>
            <Text style={styles.summaryValue}>{bills.length}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Average per Bill:</Text>
            <Text style={styles.summaryValue}>
              {activeBills.length > 0 ? formatCurrency(activeMonthlyTotal / activeBills.length) : formatCurrency(0)}
            </Text>
          </View>
          
          {/* Category Breakdown */}
          {activeBills.length > 0 && (
            <>
              <Text style={styles.summarySubtitle}>By Category:</Text>
              {Object.entries(
                activeBills.reduce((acc, bill) => {
                  acc[bill.category] = (acc[bill.category] || 0) + bill.amount;
                  return acc;
                }, {} as Record<string, number>)
              ).map(([category, amount]) => (
                <View key={category} style={styles.categoryRow}>
                  <Text style={styles.categoryLabel}>{category.charAt(0).toUpperCase() + category.slice(1)}:</Text>
                  <Text style={styles.categoryValue}>{formatCurrency(amount)}</Text>
                </View>
              ))}
            </>
          )}
        </View>
        
        {/* Active Bills Section */}
        {activeBills.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>📋 No bills added yet</Text>
            <Text style={styles.emptyStateSubtext}>Tap the + button to add your first bill</Text>
          </View>
        ) : (
          <>
            <Text style={styles.sectionTitle}>Active Bills</Text>
            {activeBills.map(bill => ( 
              <TouchableOpacity key={bill.id} style={styles.billCard} onPress={() => handleBillPress(bill)}> 
                <View style={styles.billHeader}>
                  <Text style={styles.billName}>{bill.name}</Text> 
                  <Text style={styles.billAmount}>{formatCurrency(bill.amount)}</Text> 
                </View>
                <Text style={styles.billCategory}>{bill.category.toUpperCase()} • Due Day {bill.dueDay}</Text>
              </TouchableOpacity> 
            ))}
          </>
        )}

        {/* Archived Bills Section */}
        {archivedBills.length > 0 && (
          <>
            <TouchableOpacity 
              style={styles.archivedToggle} 
              onPress={() => setShowArchivedBills(!showArchivedBills)}
            >
              <Text style={styles.archivedToggleText}>
                📁 Archived Bills ({archivedBills.length}) {showArchivedBills ? '▲' : '▼'}
              </Text>
            </TouchableOpacity>
            
            {showArchivedBills && archivedBills.map(bill => (
              <TouchableOpacity key={bill.id} style={styles.archivedBillCard} onPress={() => handleBillPress(bill)}>
                <View style={styles.billHeader}>
                  <Text style={styles.archivedBillName}>{bill.name}</Text>
                  <Text style={styles.archivedBillAmount}>{formatCurrency(bill.amount)}</Text>
                </View>
                <Text style={styles.archivedBillCategory}>{bill.category.toUpperCase()} • Due Day {bill.dueDay} • ARCHIVED</Text>
              </TouchableOpacity>
            ))}
          </>
        )}
      </ScrollView> 
      
      <TouchableOpacity style={styles.addButton} onPress={handleAddBill}> 
        <Text style={styles.addButtonText}>+</Text> 
      </TouchableOpacity> 

      <Modal
        visible={addModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Bill</Text>

            <TextInput
              style={styles.input}
              value={newBill.name}
              onChangeText={(text) => setNewBill({ ...newBill, name: text })}
              placeholder="Bill name (e.g., Electric Bill)"
              placeholderTextColor="#999"
            />

            <TextInput
              style={styles.input}
              value={newBill.amount}
              onChangeText={(text) => setNewBill({ ...newBill, amount: text })}
              placeholder="Amount (e.g., 2500)"
              placeholderTextColor="#999"
              keyboardType="numeric"
            />

            <TextInput
              style={styles.input}
              value={newBill.dueDay}
              onChangeText={(text) => setNewBill({ ...newBill, dueDay: text })}
              placeholder="Due day (1-31)"
              placeholderTextColor="#999"
              keyboardType="numeric"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.cancelButton]}
                onPress={handleCancel}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.saveButton]}
                onPress={handleSaveBill}
              >
                <Text style={styles.saveButtonText}>Add Bill</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Bill Actions Modal */}
      <Modal
        visible={actionsModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setActionsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.actionModalContent}>
            <Text style={styles.modalTitle}>
              {selectedBill?.name}
            </Text>
            <Text style={styles.billActionSubtitle}>
              {selectedBill && formatCurrency(selectedBill.amount)} • {selectedBill?.category}
            </Text>

            <TouchableOpacity style={styles.actionOptionButton} onPress={handleEditBill}>
              <Text style={styles.actionOptionText}>✏️ Edit Bill</Text>
            </TouchableOpacity>

            {!selectedBill?.isArchived ? (
              <TouchableOpacity style={styles.actionOptionButton} onPress={handleArchiveBill}>
                <Text style={styles.actionOptionText}>📁 Archive Bill</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={styles.actionOptionButton} 
                onPress={async () => {
                  if (selectedBill) {
                    await updateBill(selectedBill.id, { isArchived: false });
                    setActionsModalVisible(false);
                    setSelectedBill(null);
                  }
                }}
              >
                <Text style={styles.actionOptionText}>📤 Unarchive Bill</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={[styles.actionOptionButton, styles.deleteOption]} onPress={handleDeleteBill}>
              <Text style={[styles.actionOptionText, styles.deleteOptionText]}>🗑️ Delete Bill</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionButton, styles.cancelButton]} 
              onPress={() => setActionsModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Edit Bill Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Bill</Text>

            <TextInput
              style={styles.input}
              value={editBill.name}
              onChangeText={(text) => setEditBill({ ...editBill, name: text })}
              placeholder="Bill name (e.g., Electric Bill)"
              placeholderTextColor="#999"
            />

            <TextInput
              style={styles.input}
              value={editBill.amount}
              onChangeText={(text) => setEditBill({ ...editBill, amount: text })}
              placeholder="Amount (e.g., 2500)"
              placeholderTextColor="#999"
              keyboardType="numeric"
            />

            <TextInput
              style={styles.input}
              value={editBill.dueDay}
              onChangeText={(text) => setEditBill({ ...editBill, dueDay: text })}
              placeholder="Due day (1-31)"
              placeholderTextColor="#999"
              keyboardType="numeric"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.cancelButton]}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.saveButton]}
                onPress={handleSaveEdit}
              >
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>  
  );  } 
  
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  scrollView: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 20, textAlign: 'center' },
  total: { fontSize: 18, fontWeight: '600', color: '#2196F3', marginBottom: 10, textAlign: 'center' },
  count: { fontSize: 16, color: '#666', marginBottom: 20, textAlign: 'center' },
  emptyState: {
    backgroundColor: 'white',
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  billCard: { 
    backgroundColor: 'white', 
    padding: 15, 
    marginBottom: 10, 
    borderRadius: 8, 
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  billHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  billName: { fontSize: 16, fontWeight: '600', color: '#333', flex: 1 },
  billAmount: { fontSize: 16, fontWeight: 'bold', color: '#2196F3' },
  billCategory: {
    fontSize: 12,
    color: '#666',
    textTransform: 'uppercase',
  },
  addButton: { 
    position: 'absolute', 
    bottom: 30, 
    right: 30, 
    width: 56, 
    height: 56, 
    borderRadius: 28, 
    backgroundColor: '#2196F3', 
    justifyContent: 'center', 
    alignItems: 'center', 
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  addButtonText: { fontSize: 24, color: 'white', fontWeight: 'bold' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#fafafa',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#2196F3',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  
  // Enhanced Summary Styles
  summaryCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  summarySubtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    paddingLeft: 12,
  },
  categoryLabel: {
    fontSize: 14,
    color: '#666',
  },
  categoryValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  // New styles for clickable bills and archived sections
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 12,
  },
  archivedToggle: {
    backgroundColor: '#f8f8f8',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  archivedToggleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
  },
  archivedBillCard: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    opacity: 0.8,
  },
  archivedBillName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    flex: 1,
  },
  archivedBillAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#999',
  },
  archivedBillCategory: {
    fontSize: 12,
    color: '#999',
    textTransform: 'uppercase',
  },
  // Modal styles for actions
  actionModalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    margin: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    maxHeight: '80%',
  },
  billActionSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  actionOptionButton: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  actionOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  deleteOption: {
    backgroundColor: '#ffebee',
    borderColor: '#ffcdd2',
  },
  deleteOptionText: {
    color: '#d32f2f',
  },
});