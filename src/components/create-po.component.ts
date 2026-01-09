
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, FormArray, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { BillingService, BillItem } from '../services/po.service';
import { GeminiService } from '../services/gemini.service';

@Component({
  selector: 'app-create-po',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 pb-24">
      <div class="bg-white shadow-xl rounded-2xl overflow-hidden border border-brand-100">
        <!-- Header -->
        <div class="bg-brand-600 px-4 sm:px-6 py-4 flex justify-between items-center sticky top-0 z-10">
          <div class="flex items-center gap-3">
             <a routerLink="/dashboard" class="text-white hover:bg-brand-700 p-1 rounded">
                <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
             </a>
             <h2 class="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
               @if(tableNo()) { <span>Table {{tableNo()}}</span> }
               @else { <span>Quick Bill</span> }
             </h2>
          </div>
          <div class="text-brand-100 text-sm font-medium">
             {{ todayStr | date:'dd MMM' }}
          </div>
        </div>

        <div class="p-4 md:p-6">
          <form [formGroup]="posForm" (ngSubmit)="onSettle()">
            
            <!-- Customer Details -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 bg-brand-50 p-4 rounded-lg border border-brand-100">
              <div>
                <label class="block text-sm font-semibold text-brand-900">Customer Name</label>
                <input type="text" formControlName="customerName" placeholder="Guest Name" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 text-base p-3 border">
              </div>
              <div>
                <label class="block text-sm font-semibold text-brand-900">Phone</label>
                <div class="mt-1 flex rounded-md shadow-sm">
                  <span class="inline-flex items-center rounded-l-md border border-r-0 border-gray-300 bg-gray-50 px-3 text-gray-500 text-base">+91</span>
                  <input type="tel" formControlName="customerPhone" placeholder="9876543210" class="block w-full flex-1 rounded-none rounded-r-md border-gray-300 focus:border-brand-500 focus:ring-brand-500 text-base p-3 border">
                </div>
              </div>
              <div class="flex items-end">
                 <!-- AI Quick Add -->
                 <div class="w-full relative">
                    <label class="block text-xs font-semibold text-brand-600 mb-1">AI Voice Order</label>
                    <div class="flex gap-2">
                      <input #aiInput type="text" placeholder="e.g. 2 chai, 4 samosa" (keydown.enter)="quickAdd(aiInput.value); aiInput.value=''" class="block w-full rounded-md border-brand-200 shadow-sm focus:border-brand-500 focus:ring-brand-500 text-base p-3 border text-gray-700">
                      <button type="button" (click)="quickAdd(aiInput.value); aiInput.value=''" [disabled]="isGenerating()" class="bg-brand-600 text-white px-4 rounded-md hover:bg-brand-700 transition-colors disabled:opacity-50 shrink-0 flex items-center justify-center">
                        @if(isGenerating()) { <span class="animate-spin block w-5 h-5 border-2 border-white border-t-transparent rounded-full"></span> }
                        @else { <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg> }
                      </button>
                    </div>
                 </div>
              </div>
            </div>

            <!-- Items List -->
            <div class="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden mb-8">
              <!-- Desktop Header -->
              <div class="hidden md:grid grid-cols-12 gap-4 p-3 bg-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                <div class="col-span-6">Item Name</div>
                <div class="col-span-2 text-right">Qty</div>
                <div class="col-span-2 text-right">Price</div>
                <div class="col-span-2 text-right">Total</div>
              </div>

              <div formArrayName="items" class="divide-y divide-gray-200">
                @for (item of items.controls; track item; let i = $index) {
                  <div [formGroupName]="i" class="p-3 hover:bg-white transition-colors">
                    <!-- Mobile Layout: Stacked -->
                    <div class="md:hidden flex flex-col gap-2">
                       <div class="flex gap-2 items-center justify-between">
                          <input type="text" formControlName="description" class="block w-full bg-transparent border-b border-gray-200 focus:border-brand-500 focus:ring-0 p-2 text-gray-900 font-bold text-lg placeholder-gray-400" placeholder="Item Name">
                          <button type="button" (click)="removeItem(i)" class="text-red-400 hover:text-red-600 p-2">
                             <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                       </div>
                       <div class="grid grid-cols-3 gap-2">
                          <div>
                            <label class="text-xs text-gray-500">Qty</label>
                            <input type="number" formControlName="quantity" class="block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 text-base p-2 border text-center">
                          </div>
                          <div>
                            <label class="text-xs text-gray-500">Price</label>
                            <input type="number" formControlName="unitPrice" class="block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 text-base p-2 border text-center">
                          </div>
                          <div class="text-right">
                            <label class="text-xs text-gray-500">Total</label>
                            <div class="font-bold text-gray-900 text-lg mt-2">
                               ₹{{ (item.get('quantity')?.value * item.get('unitPrice')?.value) | number:'1.0-0' }}
                            </div>
                          </div>
                       </div>
                    </div>

                    <!-- Desktop Layout: Grid -->
                    <div class="hidden md:grid grid-cols-12 gap-4 items-center">
                      <div class="col-span-6 flex gap-2 items-center">
                        <button type="button" (click)="removeItem(i)" class="text-red-400 hover:text-red-600 p-1">
                          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                        <input type="text" formControlName="description" class="block w-full bg-transparent border-none focus:ring-0 p-0 text-gray-900 font-medium placeholder-gray-400" placeholder="Item Name">
                      </div>
                      <div class="col-span-2">
                        <input type="number" formControlName="quantity" class="block w-full text-right rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm py-1 px-2 border">
                      </div>
                      <div class="col-span-2">
                        <input type="number" formControlName="unitPrice" class="block w-full text-right rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm py-1 px-2 border">
                      </div>
                      <div class="col-span-2 text-right font-bold text-gray-900">
                        ₹{{ (item.get('quantity')?.value * item.get('unitPrice')?.value) | number:'1.0-0' }}
                      </div>
                    </div>
                  </div>
                }
              </div>
              
              <div class="p-4 bg-gray-50 border-t border-gray-200">
                <button type="button" (click)="addItem()" class="w-full md:w-auto flex justify-center items-center gap-2 px-4 py-3 border-2 border-dashed border-brand-300 text-brand-700 rounded-lg hover:bg-brand-50 font-medium transition-colors">
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
                  Add Item Manually
                </button>
              </div>
            </div>

            <!-- Total Bar (Sticky Bottom on Mobile) -->
            <div class="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] md:relative md:shadow-none md:border-none md:bg-transparent md:p-0 z-20">
               <div class="max-w-5xl mx-auto flex justify-between items-center gap-4">
                  <div class="text-left">
                     <div class="text-xs text-gray-500 uppercase tracking-wide">Total</div>
                     <div class="text-2xl font-black text-brand-600">₹{{ totals().total.toFixed(0) }}</div>
                  </div>
                  
                  <div class="flex gap-2">
                     @if(tableNo()) {
                        <button type="button" (click)="onSaveDraft()" [disabled]="totals().total === 0" class="px-4 py-3 bg-orange-100 text-orange-700 rounded-lg font-bold shadow-sm hover:bg-orange-200 disabled:opacity-50">
                          Update Order
                        </button>
                     }
                     <button type="submit" [disabled]="posForm.invalid || totals().total === 0" class="px-6 py-3 bg-brand-600 text-white rounded-lg font-bold shadow-lg hover:bg-brand-700 disabled:opacity-50 flex items-center gap-2">
                       <span>Settle & Print</span>
                     </button>
                  </div>
               </div>
            </div>

          </form>
        </div>
      </div>
    </div>
  `
})
export class CreatePoComponent implements OnInit {
  fb = inject(FormBuilder);
  router = inject<Router>(Router);
  route = inject<ActivatedRoute>(ActivatedRoute);
  billingService = inject(BillingService);
  gemini = inject(GeminiService);
  isGenerating = signal(false);
  todayStr = new Date();
  tableNo = signal<string | null>(null);

  posForm = this.fb.group({
    customerName: [''],
    customerPhone: ['', [Validators.pattern('^[0-9]{10}$')]],
    items: this.fb.array([])
  });

  get items() {
    return this.posForm.get('items') as FormArray;
  }

  totals = signal({ total: 0 });

  constructor() {
    this.posForm.valueChanges.subscribe(() => this.calculateTotals());
  }

  ngOnInit() {
    // Check for table param
    this.route.queryParams.subscribe(params => {
       const table = params['table'];
       if (table) {
          this.tableNo.set(table);
          this.loadTableData(table);
       } else {
          this.addItem(); // Start with empty row for quick bill
       }
    });
  }

  loadTableData(table: string) {
     const activeOrder = this.billingService.getActiveOrder(table);
     if (activeOrder) {
        this.posForm.patchValue({
           customerName: activeOrder.customerName,
           customerPhone: activeOrder.customerPhone
        });
        // Clear default items
        this.items.clear();
        // Add existing items
        activeOrder.items.forEach(item => this.addItem(item));
     } else {
        this.addItem();
     }
  }

  addItem(data?: Partial<BillItem>) {
    const group = this.fb.group({
      description: [data?.description || '', Validators.required],
      quantity: [data?.quantity || 1, [Validators.required, Validators.min(1)]],
      unitPrice: [data?.unitPrice || 0, [Validators.required, Validators.min(0)]]
    });
    this.items.push(group);
    this.calculateTotals(); 
  }

  removeItem(index: number) {
    this.items.removeAt(index);
  }

  calculateTotals() {
    const rawItems = this.items.value as any[];
    const total = rawItems.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
    this.totals.set({ total });
  }

  async quickAdd(prompt: string) {
    if (!prompt.trim()) return;
    this.isGenerating.set(true);
    
    try {
      const newItems = await this.gemini.generateLineItems(prompt);
      
      // If we have 1 empty item at start, remove it
      if (this.items.length === 1 && !this.items.at(0).get('description')?.value) {
        this.items.removeAt(0);
      }

      if (Array.isArray(newItems)) {
        newItems.forEach((item: any) => this.addItem(item));
      }
    } catch (err) {
      alert('Could not understand order.');
    } finally {
      this.isGenerating.set(false);
    }
  }

  getCleanItems() {
    const val = this.posForm.value;
    return (val.items as any[]).map(item => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.quantity * item.unitPrice
      }));
  }

  onSaveDraft() {
    if (this.posForm.valid && this.tableNo()) {
       const val = this.posForm.value;
       this.billingService.updateActiveOrder(this.tableNo()!, {
          customerName: val.customerName || '',
          customerPhone: val.customerPhone || '',
          items: this.getCleanItems()
       });
       this.router.navigate(['/dashboard']);
    }
  }

  onSettle() {
    if (this.posForm.valid) {
      const val = this.posForm.value;
      const cleanItems = this.getCleanItems();

      const id = this.billingService.addBill({
        billNo: Math.floor(100000 + Math.random() * 900000).toString(),
        tableNo: this.tableNo() || undefined,
        customerName: val.customerName || 'Guest',
        customerPhone: val.customerPhone || '',
        date: new Date().toISOString(),
        items: cleanItems,
        totalAmount: this.totals().total
      });

      this.router.navigate(['/invoice', id]);
    }
  }
}
