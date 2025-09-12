/**
 * Budget Buddy Mobile - Bills Store
 * @license MIT
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '../utils/logger';

export interface Bill {
  id: string;
  name: string;
  amount: number;
  dueDay: number; // Day of month (1-31) for recurring bills
  category: 'utilities' | 'rent' | 'food' | 'transport' | 'entertainment' | 'healthcare' | 'other';
  isPaid?: boolean;
  paymentDate?: string;
  isRecurring: boolean;
  isArchived?: boolean; // For completed/archived bills
  createdAt: string;
  updatedAt: string;
}

export interface BillTrends {
  currentMonth: number;
  lastMonth: number;
  percentageChange: number;
  categoryBreakdown: Record<string, number>;
  monthlyHistory: Array<{
    month: string;
    total: number;
  }>;
}

interface BillsState {
  // Data state
  bills: Bill[];
  monthlyTotal: number;
  trends: BillTrends | null;
  
  // UI state
  isLoading: boolean;
  error: string | null;
  
  // Offline state
  isOffline: boolean;
  pendingSync: Bill[];
  
  // Actions
  fetchBills: () => Promise<void>;
  addBill: (bill: Omit<Bill, 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateBill: (id: string, updates: Partial<Bill>) => Promise<void>;
  deleteBill: (id: string) => Promise<void>;
  markBillPaid: (id: string, paymentDate?: string) => Promise<void>;
  getMonthlyTrends: () => Promise<void>;
  
  // Utility methods
  getActiveBills: () => Bill[];
  getArchivedBills: () => Bill[];
  getBillsForCurrentMonth: () => Bill[];
  getUpcomingBills: (days?: number) => Bill[];
  getOverdueBills: () => Bill[];
  calculateMonthlyTotal: () => number;
}

// Helper functions for working with dueDay system
const createDueDateFromDay = (dueDay: number, year?: number, month?: number): Date => {
  const now = new Date();
  const targetYear = year ?? now.getFullYear();
  const targetMonth = month ?? now.getMonth();
  
  // Handle edge cases where dueDay might exceed month's days
  const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
  const validDueDay = Math.min(dueDay, daysInMonth);
  
  return new Date(targetYear, targetMonth, validDueDay);
};

const isDueSoon = (bill: Bill, days = 7): boolean => {
  const now = new Date();
  const dueDate = createDueDateFromDay(bill.dueDay);
  const timeDiff = dueDate.getTime() - now.getTime();
  const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
  
  return daysDiff <= days && daysDiff >= 0;
};

const isOverdue = (bill: Bill): boolean => {
  const now = new Date();
  const dueDate = createDueDateFromDay(bill.dueDay);
  
  return dueDate < now && !bill.isPaid;
};

export const useBillsStore = create<BillsState>()(
  persist(
    (set, get) => ({
      // Initial state
      bills: [],
      monthlyTotal: 0,
      trends: null,
      isLoading: false,
      error: null,
      isOffline: false,
      pendingSync: [],

      // Core CRUD operations
      async fetchBills() {
        try {
          set({ isLoading: true, error: null });
          
          // In a real app, this would fetch from an API
          // For now, we'll just use the persisted data
          const { bills } = get();
          const monthlyTotal = get().calculateMonthlyTotal();
          
          set({ 
            bills,
            monthlyTotal,
            isLoading: false 
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch bills',
            isLoading: false 
          });
        }
      },

      async addBill(billData) {
        try {
          set({ isLoading: true, error: null });
          
          const newBill: Bill = {
            ...billData,
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          const { bills } = get();
          const updatedBills = [...bills, newBill];
          const monthlyTotal = updatedBills
            .filter(b => !b.isArchived && b.isRecurring)
            .reduce((sum, bill) => sum + bill.amount, 0);

          set({ 
            bills: updatedBills,
            monthlyTotal,
            isLoading: false 
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to add bill',
            isLoading: false 
          });
        }
      },

      async updateBill(id, updates) {
        try {
          logger.debug('Store updateBill called', { id, updates });
          set({ isLoading: true, error: null });
          
          const { bills } = get();
          const updatedBills = bills.map(bill => 
            bill.id === id 
              ? { ...bill, ...updates, updatedAt: new Date().toISOString() }
              : bill
          );

          logger.debug('Bills updated', { count: updatedBills.length });

          const monthlyTotal = updatedBills
            .filter(b => !b.isArchived && b.isRecurring)
            .reduce((sum, bill) => sum + bill.amount, 0);

          set({ 
            bills: updatedBills,
            monthlyTotal,
            isLoading: false 
          });
          logger.debug('Store state updated successfully');
        } catch (error) {
          logger.error('Store updateBill error', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to update bill',
            isLoading: false 
          });
        }
      },

      async deleteBill(id) {
        try {
          logger.debug('Store deleteBill called', { id });
          set({ isLoading: true, error: null });
          
          const { bills } = get();
          const updatedBills = bills.filter(bill => bill.id !== id);
          const monthlyTotal = updatedBills
            .filter(b => !b.isArchived && b.isRecurring)
            .reduce((sum, bill) => sum + bill.amount, 0);

          set({ 
            bills: updatedBills,
            monthlyTotal,
            isLoading: false 
          });
          logger.debug('Store delete completed successfully');
        } catch (error) {
          logger.error('Store deleteBill error', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to delete bill',
            isLoading: false 
          });
        }
      },

      async markBillPaid(id, paymentDate) {
        try {
          await get().updateBill(id, {
            isPaid: true,
            paymentDate: paymentDate || new Date().toISOString(),
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to mark bill as paid'
          });
        }
      },

      async getMonthlyTrends() {
        try {
          const bills = get().getActiveBills();
          const now = new Date();
          const currentMonth = now.getMonth();
          const currentYear = now.getFullYear();

          // For recurring bills, current and last month totals are the same
          const activeBills = bills.filter(bill => !bill.isArchived && bill.isRecurring);
          const currentTotal = activeBills.reduce((sum, bill) => sum + bill.amount, 0);
          
          // For trends, we can compare with archived bills or payment history
          const lastTotal = currentTotal; // Simplified for now
          const percentageChange = 0; // No change for recurring bills

          const categoryBreakdown = activeBills.reduce((acc, bill) => {
            acc[bill.category] = (acc[bill.category] || 0) + bill.amount;
            return acc;
          }, {} as Record<string, number>);

          // Generate monthly history for the past 6 months
          const monthlyHistory = [];
          for (let i = 5; i >= 0; i--) {
            const date = new Date(currentYear, currentMonth - i, 1);
            monthlyHistory.push({
              month: date.toLocaleDateString('en-PH', { year: 'numeric', month: 'short' }),
              total: currentTotal, // Same for all months for recurring bills
            });
          }

          const trends: BillTrends = {
            currentMonth: currentTotal,
            lastMonth: lastTotal,
            percentageChange,
            categoryBreakdown,
            monthlyHistory,
          };

          set({ trends });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to get trends'
          });
        }
      },

      // Utility methods
      getActiveBills() {
        return get().bills.filter(bill => !bill.isArchived);
      },

      getArchivedBills() {
        return get().bills.filter(bill => bill.isArchived);
      },

      getBillsForCurrentMonth() {
        return get().getActiveBills().filter(bill => bill.isRecurring);
      },

      getUpcomingBills(days = 7) {
        const activeBills = get().getActiveBills();
        return activeBills.filter(bill => isDueSoon(bill, days));
      },

      getOverdueBills() {
        const activeBills = get().getActiveBills();
        return activeBills.filter(bill => isOverdue(bill));
      },

      calculateMonthlyTotal() {
        return get().getActiveBills()
          .filter(bill => bill.isRecurring)
          .reduce((sum, bill) => sum + bill.amount, 0);
      },
    }),
    {
      name: 'bills-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
