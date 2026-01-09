
import { Injectable, signal, computed } from '@angular/core';

export interface BillItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Bill {
  id: string;
  billNo: string;
  tableNo?: string;
  customerName: string;
  customerPhone: string;
  date: string; // ISO Date String
  timestamp: number;
  items: BillItem[];
  totalAmount: number;
}

export interface ActiveOrder {
  tableNo: string;
  customerName: string;
  customerPhone: string;
  items: BillItem[];
  startTime: number;
}

@Injectable({
  providedIn: 'root'
})
export class BillingService {
  private storageKey = 'dhaba_pos_bills';
  private activeKey = 'dhaba_active_orders';
  
  bills = signal<Bill[]>(this.loadBills());
  activeOrders = signal<Record<string, ActiveOrder>>(this.loadActiveOrders());

  // Derived state for dashboard
  stats = computed(() => {
    const all = this.bills();
    const today = new Date().toISOString().split('T')[0];
    
    // Filter helper
    const getSales = (days: number) => {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      const cutoffTime = cutoff.getTime();
      return all
        .filter(b => b.timestamp >= cutoffTime)
        .reduce((sum, b) => sum + b.totalAmount, 0);
    };

    return {
      totalOrders: all.length,
      todaySales: all.filter(b => b.date.startsWith(today)).reduce((sum, b) => sum + b.totalAmount, 0),
      last7Days: getSales(7),
      last30Days: getSales(30)
    };
  });

  // --- Utility ---
  private generateId(): string {
    // Robust ID generator that works in non-secure contexts (http localhost)
    try {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID();
        }
    } catch(e) {
        // Ignore error
    }
    // Fallback timestamp + random string
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  // --- Active Order (Table) Management ---

  updateActiveOrder(tableNo: string, data: { customerName: string; customerPhone: string; items: BillItem[] }) {
    this.activeOrders.update(current => {
      const existing = current[tableNo];
      const newState = { ...current };
      
      newState[tableNo] = {
        tableNo,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        items: data.items,
        startTime: existing ? existing.startTime : Date.now()
      };
      
      this.saveActiveOrders(newState);
      return newState;
    });
  }

  getActiveOrder(tableNo: string): ActiveOrder | undefined {
    return this.activeOrders()[tableNo];
  }

  clearTable(tableNo: string) {
    this.activeOrders.update(current => {
      const newState = { ...current };
      delete newState[tableNo];
      this.saveActiveOrders(newState);
      return newState;
    });
  }

  // --- Billing Management ---

  addBill(billData: Omit<Bill, 'id' | 'timestamp'>) {
    const newBill: Bill = {
      ...billData,
      id: this.generateId(), // Use robust ID generator
      timestamp: new Date(billData.date).getTime()
    };
    
    this.bills.update(current => [newBill, ...current]);
    this.saveBills();
    
    // If this bill was for a table, automatically clear that table
    if (newBill.tableNo) {
      this.clearTable(newBill.tableNo);
    }
    
    return newBill.id;
  }

  getBill(id: string): Bill | undefined {
    return this.bills().find(b => b.id === id);
  }

  getBillsByRange(days: number): Bill[] {
    const cutoff = new Date();
    cutoff.setHours(0, 0, 0, 0);
    if (days === 1) {
       // Just keep cutoff as today start
    } else {
       cutoff.setDate(cutoff.getDate() - (days - 1));
    }
    const cutoffTime = cutoff.getTime();
    return this.bills().filter(b => b.timestamp >= cutoffTime);
  }

  exportToCSV(days: number) {
    const data = this.getBillsByRange(days);
    if (data.length === 0) return;

    const headers = ['Bill No', 'Date', 'Table', 'Customer Name', 'Phone', 'Items', 'Total Amount'];
    const csvContent = [
      headers.join(','),
      ...data.map(bill => {
        const itemSummary = bill.items.map(i => `${i.description} (${i.quantity})`).join('; ');
        return [
          bill.billNo,
          bill.date,
          bill.tableNo || 'Counter',
          `"${bill.customerName}"`,
          bill.customerPhone,
          `"${itemSummary}"`,
          bill.totalAmount
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales_report_${days}days_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  // --- Data Management for Backup/Restore ---

  restoreBackupData(data: { bills?: Bill[], activeOrders?: Record<string, ActiveOrder> }) {
    if (data.bills && Array.isArray(data.bills)) {
        // Merge bills, avoiding duplicates by ID
        const currentBills = this.bills();
        const currentIds = new Set(currentBills.map(b => b.id));
        const newBills = data.bills.filter(b => !currentIds.has(b.id));
        
        if (newBills.length > 0) {
            this.bills.update(c => [...newBills, ...c].sort((a,b) => b.timestamp - a.timestamp));
            this.saveBills();
        }
    }
    
    if (data.activeOrders) {
        // Merge active orders
        this.activeOrders.update(c => {
            const newState = { ...c, ...data.activeOrders };
            this.saveActiveOrders(newState);
            return newState;
        });
    }
  }

  private saveBills() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.bills()));
    } catch (e) {
      console.error('Failed to save bills to localStorage', e);
      alert('Warning: Storage is full or unavailable. Data may not persist.');
    }
  }

  private loadBills(): Bill[] {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to parse bills from localStorage', e);
      return [];
    }
  }

  private saveActiveOrders(orders: Record<string, ActiveOrder>) {
    try {
      localStorage.setItem(this.activeKey, JSON.stringify(orders));
    } catch (e) {
      console.error('Failed to save active orders', e);
    }
  }

  private loadActiveOrders(): Record<string, ActiveOrder> {
    try {
      const data = localStorage.getItem(this.activeKey);
      return data ? JSON.parse(data) : {};
    } catch (e) {
       console.error('Failed to parse active orders', e);
       return {};
    }
  }
}
