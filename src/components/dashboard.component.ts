
import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BillingService } from '../services/po.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <!-- Header -->
      <div class="md:flex md:items-center md:justify-between mb-6">
        <div class="min-w-0 flex-1">
          <h2 class="text-2xl font-bold leading-7 text-brand-900 sm:truncate sm:text-3xl sm:tracking-tight">Foresta Dashboard</h2>
        </div>
        <div class="mt-4 flex gap-3 md:ml-4 md:mt-0">
          <button (click)="exportCSV()" class="inline-flex items-center rounded-md bg-white border border-brand-300 px-3 py-2 text-sm font-semibold text-brand-700 shadow-sm hover:bg-brand-50 cursor-pointer">
            Export CSV
          </button>
          <a routerLink="/create" class="inline-flex items-center rounded-md bg-brand-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-brand-700 cursor-pointer">
            + Quick Bill
          </a>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div class="bg-white overflow-hidden shadow rounded-lg border-l-4 border-brand-500 p-4">
            <dt class="text-xs font-medium text-gray-500 uppercase">Today's Sales</dt>
            <dd class="mt-1 text-2xl font-bold text-gray-900">₹{{ billingService.stats().todaySales.toFixed(0) }}</dd>
        </div>
        <div class="bg-white overflow-hidden shadow rounded-lg border-l-4 border-orange-400 p-4">
            <dt class="text-xs font-medium text-gray-500 uppercase">7 Days</dt>
            <dd class="mt-1 text-2xl font-bold text-gray-900">₹{{ billingService.stats().last7Days.toFixed(0) }}</dd>
        </div>
        <div class="bg-white overflow-hidden shadow rounded-lg border-l-4 border-orange-300 p-4">
            <dt class="text-xs font-medium text-gray-500 uppercase">Total Orders</dt>
            <dd class="mt-1 text-2xl font-bold text-gray-900">{{ billingService.stats().totalOrders }}</dd>
        </div>
        <div class="bg-white overflow-hidden shadow rounded-lg border-l-4 border-blue-500 p-4">
            <dt class="text-xs font-medium text-gray-500 uppercase">Active Tables</dt>
            <dd class="mt-1 text-2xl font-bold text-gray-900">{{ activeTableCount() }}</dd>
        </div>
      </div>

      <!-- Tabs -->
      <div class="border-b border-gray-200 mb-6">
        <nav class="-mb-px flex space-x-8" aria-label="Tabs">
          <button (click)="activeTab.set('tables')" [class]="activeTab() === 'tables' ? 'border-brand-500 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'" class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 cursor-pointer">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m8-2a2 2 0 100-4m0 4a2 2 0 110-4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4" /></svg>
            Live Tables
          </button>
          <button (click)="activeTab.set('history')" [class]="activeTab() === 'history' ? 'border-brand-500 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'" class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 cursor-pointer">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Order History
          </button>
          
        </nav>
      </div>

      <!-- Tables Grid View -->
      @if (activeTab() === 'tables') {
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          @for (table of tables; track table) {
            @let order = billingService.getActiveOrder(table.toString());
            <a [routerLink]="['/create']" [queryParams]="{table: table}" 
               class="relative block p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-lg aspect-[4/3] flex flex-col justify-between cursor-pointer"
               [class]="order ? 'bg-orange-50 border-orange-500' : 'bg-white border-dashed border-gray-300 hover:border-brand-300'">
              
              <div class="flex justify-between items-start">
                <span class="text-lg font-bold" [class]="order ? 'text-orange-700' : 'text-gray-500'">Table {{ table }}</span>
                @if (order) {
                  <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800 animate-pulse">
                    Busy
                  </span>
                } @else {
                  <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                    Free
                  </span>
                }
              </div>

              <div class="mt-2">
                @if (order) {
                  <div class="text-sm font-medium text-gray-900 truncate">{{ order.customerName || 'Guest' }}</div>
                  <div class="text-2xl font-bold text-brand-600 mt-1">
                    ₹{{ calculateOrderTotal(order).toFixed(0) }}
                  </div>
                  <div class="text-xs text-gray-500 mt-1">{{ order.items.length }} Items</div>
                } @else {
                  <div class="flex justify-center items-center h-full text-gray-300">
                     <svg class="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M12 4v16m8-8H4" /></svg>
                  </div>
                }
              </div>
            </a>
          }
        </div>
      }

      <!-- History List View -->
      @if (activeTab() === 'history') {
        <div class="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl overflow-hidden">
          <div class="px-4 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <h3 class="text-base font-semibold leading-6 text-gray-900">Completed Orders</h3>
            <div class="flex bg-white rounded-md shadow-sm p-0.5">
              <button (click)="filterDays.set(1)" [class]="filterDays() === 1 ? 'bg-gray-100 text-brand-600 font-bold' : 'text-gray-500 hover:text-gray-700'" class="px-3 py-1 text-xs rounded transition-all cursor-pointer">Today</button>
              <button (click)="filterDays.set(7)" [class]="filterDays() === 7 ? 'bg-gray-100 text-brand-600 font-bold' : 'text-gray-500 hover:text-gray-700'" class="px-3 py-1 text-xs rounded transition-all cursor-pointer">7 Days</button>
            </div>
          </div>
          
          <ul role="list" class="divide-y divide-gray-100">
            @for (bill of getFilteredBills(); track bill.id) {
              <li class="relative flex justify-between gap-x-6 px-4 py-4 hover:bg-gray-50 transition-colors">
                <div class="flex min-w-0 gap-x-4">
                  <div class="min-w-0 flex-auto">
                    <p class="text-sm font-semibold leading-6 text-gray-900">
                      <a [routerLink]="['/invoice', bill.id]" class="cursor-pointer">
                        <span class="absolute inset-x-0 -top-px bottom-0"></span>
                        <span class="font-mono text-gray-500">#{{ bill.billNo }}</span>
                        <span class="mx-2 text-gray-300">|</span>
                        @if(bill.tableNo) { <span class="text-brand-600 font-bold">T-{{bill.tableNo}}</span> }
                        @else { <span class="text-gray-500">Counter</span> }
                        <span class="mx-2 text-gray-300">|</span>
                        {{ bill.customerName || 'Guest' }}
                      </a>
                    </p>
                    <p class="mt-1 flex text-xs leading-5 text-gray-500">
                      {{ bill.date | date:'shortTime' }} &middot; {{ bill.items.length }} Items
                    </p>
                  </div>
                </div>
                <div class="flex shrink-0 items-center gap-x-4">
                  <div class="hidden sm:flex sm:flex-col sm:items-end">
                    <p class="text-base font-bold leading-6 text-gray-900">₹{{ bill.totalAmount.toFixed(2) }}</p>
                  </div>
                  <svg class="h-5 w-5 flex-none text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clip-rule="evenodd" />
                  </svg>
                </div>
              </li>
            } @empty {
               <li class="px-4 py-8 text-center text-gray-500 text-sm">No orders found.</li>
            }
          </ul>
        </div>
      }

      <!-- Settings / Database View -->
      @if (activeTab() === 'settings') {
        <div class="bg-white shadow sm:rounded-lg overflow-hidden">
          <div class="px-4 py-5 sm:p-6">
            <h3 class="text-lg leading-6 font-medium text-gray-900">Database Management</h3>
            <div class="mt-2 max-w-xl text-sm text-gray-500">
              <p>Since this app runs in your browser, your data is stored locally. You can download a backup copy or restore from a previous backup.</p>
            </div>
            
            <div class="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
               <div class="border border-gray-200 rounded-lg p-5 bg-gray-50">
                  <h4 class="font-bold text-gray-800 mb-2">Backup Data</h4>
                  <p class="text-xs text-gray-500 mb-4">Download a JSON file containing all sales, customers, and active orders.</p>
                  <button (click)="backupData()" class="w-full flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 cursor-pointer">
                    <svg class="mr-2 -ml-1 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    Download Backup
                  </button>
               </div>

               <div class="border border-gray-200 rounded-lg p-5 bg-gray-50">
                  <h4 class="font-bold text-gray-800 mb-2">Restore Data</h4>
                  <p class="text-xs text-gray-500 mb-4">Upload a backup JSON file to restore your data. This merges with existing data.</p>
                  <!-- Added block display and cursor pointer for reliable clicking -->
                  <label class="block w-full flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 cursor-pointer relative">
                    <svg class="mr-2 -ml-1 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                    <span>Select Backup File</span>
                    <input type="file" (change)="restoreData($event)" accept=".json" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer">
                  </label>
               </div>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class DashboardComponent {
  billingService = inject(BillingService);
  authService = inject(AuthService);
  
  filterDays = signal(1);
  activeTab = signal<'tables' | 'history' | 'settings'>('tables');
  
  // Define tables 1-12
  tables = Array.from({length: 12}, (_, i) => i + 1);

  activeTableCount = computed(() => {
    return Object.keys(this.billingService.activeOrders()).length;
  });

  calculateOrderTotal(order: any): number {
    return order.items.reduce((acc: number, item: any) => acc + (item.unitPrice * item.quantity), 0);
  }

  getFilteredBills() {
    return this.billingService.getBillsByRange(this.filterDays());
  }

  exportCSV() {
    this.billingService.exportToCSV(this.filterDays());
  }

  // --- Database Logic ---

  backupData() {
    const data = {
        users: this.authService.getBackupData(),
        bills: this.billingService.bills(),
        activeOrders: this.billingService.activeOrders(),
        timestamp: new Date().toISOString(),
        version: '1.0'
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `foresta_backup_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  async restoreData(event: any) {
    const file = event.target.files[0];
    if(!file) return;
    
    if (!confirm('This will merge the backup data with your current data. Continue?')) {
        event.target.value = ''; // Reset input
        return;
    }

    try {
        const text = await file.text();
        const data = JSON.parse(text);
        
        if (data.users) this.authService.restoreBackupData(data.users);
        if (data.bills || data.activeOrders) this.billingService.restoreBackupData(data);
        
        alert('Data restored successfully!');
        window.location.reload(); // Reload to refresh all signals/state
    } catch(e) {
        console.error(e);
        alert('Invalid backup file. Please upload a valid JSON backup.');
    } finally {
        event.target.value = '';
    }
  }
}
