
import { Component, inject, computed, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { BillingService } from '../services/po.service';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

@Component({
  selector: 'app-invoice-view',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gray-100 py-8 flex flex-col items-center">
      
      <!-- Actions -->
      <div class="w-full max-w-sm mb-6 px-4 no-print">
        <div class="flex justify-between items-center mb-4">
            <a routerLink="/dashboard" class="text-sm font-medium text-gray-500 hover:text-gray-900 flex items-center gap-1">
            &larr; Back
            </a>
            <button (click)="print()" class="bg-slate-800 text-white px-4 py-2 rounded-full shadow hover:bg-slate-900 flex items-center gap-2 text-sm">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                Print
            </button>
        </div>
        
        <!-- WhatsApp Actions -->
        @if (bill()?.customerPhone) {
          <div class="flex flex-col gap-3">
             <div class="bg-white p-3 rounded-lg shadow-sm border border-brand-100">
                <p class="text-xs text-gray-500 font-semibold mb-2 uppercase tracking-wide">Share via WhatsApp</p>
                <div class="grid grid-cols-2 gap-3">
                    <button (click)="shareReceiptPDF()" [disabled]="isSharing()" class="flex flex-col justify-center items-center gap-1 bg-green-600 text-white py-3 rounded-lg shadow hover:bg-green-700 font-medium transition-colors disabled:opacity-70">
                        @if(isSharing()) {
                            <span class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                            <span class="text-xs">Generating...</span>
                        } @else {
                            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                            <span class="text-sm">Send PDF</span>
                        }
                    </button>
                    <button (click)="shareReceiptText()" class="flex flex-col justify-center items-center gap-1 bg-white border border-green-600 text-green-700 py-3 rounded-lg shadow-sm hover:bg-green-50 font-medium transition-colors">
                        <span class="text-2xl">💬</span>
                        <span class="text-sm">Send Text</span>
                    </button>
                </div>
             </div>
          </div>
        }
      </div>

      <!-- Receipt -->
      @if (bill(); as b) {
        <div class="bg-white p-6 shadow-2xl w-full max-w-sm print-area text-slate-900 font-mono text-sm leading-relaxed" id="receipt">
          <div class="text-center border-b-2 border-dashed border-slate-300 pb-4 mb-4">
            <h1 class="text-2xl font-black uppercase tracking-widest text-slate-800">FORESTA</h1>
            <p class="text-xs text-slate-500 mt-1">Restaurant & Cafe</p>
            <p class="text-xs text-slate-500">Tel: +91 7218185140</p>
          </div>

          <div class="flex justify-between text-xs mb-2">
            <span>Bill No: {{ b.billNo }}</span>
            <span>{{ b.date | date:'dd/MM/yy HH:mm' }}</span>
          </div>
          <div class="flex justify-between text-xs mb-4 border-b border-slate-200 pb-2">
            <span>Customer: <span class="font-bold">{{ b.customerName }}</span></span>
            @if(b.tableNo) { <span class="font-bold bg-slate-200 px-1 rounded">Table {{b.tableNo}}</span> }
          </div>

          <div class="mb-4">
            <table class="w-full text-left">
              <thead>
                <tr class="text-xs border-b border-slate-800">
                  <th class="py-1">Item</th>
                  <th class="text-right py-1">Qty</th>
                  <th class="text-right py-1">Amt</th>
                </tr>
              </thead>
              <tbody>
                @for (item of b.items; track $index) {
                  <tr>
                    <td class="py-1 pr-2 truncate max-w-[140px]">{{ item.description }}</td>
                    <td class="text-right py-1">{{ item.quantity }}</td>
                    <td class="text-right py-1">{{ item.total }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <div class="border-t-2 border-dashed border-slate-300 pt-2 mb-6">
            <div class="flex justify-between text-lg font-bold">
              <span>TOTAL</span>
              <span>₹{{ b.totalAmount }}</span>
            </div>
            <div class="text-center text-xs text-slate-500 mt-4 italic">
              Thank you for dining with us!
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class InvoiceViewComponent {
  route = inject(ActivatedRoute);
  billingService = inject(BillingService);
  isSharing = signal(false);
  
  billId = this.route.snapshot.paramMap.get('id');
  
  bill = computed(() => {
    return this.billingService.getBill(this.billId || '');
  });

  print() {
    window.print();
  }

  shareReceiptText() {
    const b = this.bill();
    if (b) this.openWhatsAppText(b, false);
  }

  async shareReceiptPDF() {
    const b = this.bill();
    if (!b || this.isSharing()) return;

    this.isSharing.set(true);

    try {
      const receiptElement = document.getElementById('receipt');
      if (!receiptElement) throw new Error('Receipt element not found');

      // 1. Generate Image from HTML
      const canvas = await html2canvas(receiptElement as HTMLElement, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true // Helps with external images/fonts
      });
      const imgData = canvas.toDataURL('image/png');

      // 2. Generate PDF using jsPDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      
      const pdfBlob = pdf.output('blob');
      const pdfFile = new File([pdfBlob], `Bill_${b.billNo}.pdf`, { type: 'application/pdf' });

      // 3. Try Native Share (Best for Mobile WhatsApp)
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
        await navigator.share({
          files: [pdfFile],
          title: `Bill #${b.billNo}`,
          text: `Here is your bill from Foresta. Total: ₹${b.totalAmount}`
        });
      } else {
        // 4. Fallback: Download PDF & Open WhatsApp Text
        // Explain to user
        const confirmed = confirm('To share PDF on Desktop/Web, we will download the PDF file. Please attach it manually to the WhatsApp chat that opens next.\n\nProceed?');
        
        if (confirmed) {
            const url = URL.createObjectURL(pdfBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Bill_${b.billNo}.pdf`;
            a.click();
            URL.revokeObjectURL(url);
            
            // Wait a moment for download to start, then open WhatsApp
            setTimeout(() => {
                this.openWhatsAppText(b, true);
            }, 1000);
        }
      }
    } catch (err) {
      console.error('PDF Generation failed:', err);
      alert('Could not share PDF directly. Opening text version instead.');
      if (b) this.openWhatsAppText(b, false);
    } finally {
      this.isSharing.set(false);
    }
  }

  openWhatsAppText(b: any, pdfDownloaded: boolean) {
    if (!b.customerPhone) return;

    // Enhanced Text Formatting for WhatsApp
    let text = `🧾 *FORESTA RECEIPT*\n`;
    text += `Bill No: *${b.billNo}*\n`;
    text += `Date: ${new Date(b.date).toLocaleString()}\n`;
    if (b.tableNo) text += `Table: ${b.tableNo}\n`;
    
    text += `--------------------\n`;
    text += `*ITEMS*\n`;
    b.items.forEach((i: any) => {
      text += `▫ ${i.description} x${i.quantity} = ₹${i.total}\n`;
    });
    
    text += `--------------------\n`;
    text += `*TOTAL: ₹${b.totalAmount}*\n`;
    text += `--------------------\n`;
    
    if (pdfDownloaded) {
      text += `\n📎 *PDF Bill Downloaded*\nPlease attach the downloaded file.`;
    } else {
      text += `\nThank you for visiting Foresta! 🌳`;
    }

    const url = `https://wa.me/91${b.customerPhone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  }
}
