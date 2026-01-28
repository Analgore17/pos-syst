
import 'zone.js'; // Standard Angular Change Detection
import '@angular/compiler'; // JIT Compilation - Must be first
import { enableProdMode, importProvidersFrom } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
// import { provideZonelessChangeDetection } from '@angular/core'; // Removed to use Zone.js
import { provideRouter, withHashLocation, Routes } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { AppComponent } from './src/app.component';
import { LoginComponent } from './src/components/login.component';
import { DashboardComponent } from './src/components/dashboard.component';
import { CreatePoComponent } from './src/components/create-po.component';
import { InvoiceViewComponent } from './src/components/invoice-view.component';
import { AuthGuard } from './src/services/auth.guard';
import { isDevMode } from '@angular/core';
import { provideServiceWorker } from '@angular/service-worker';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
  { path: 'create', component: CreatePoComponent, canActivate: [AuthGuard] },
  { path: 'invoice/:id', component: InvoiceViewComponent, canActivate: [AuthGuard] },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: 'dashboard' }
];

bootstrapApplication(AppComponent, {
  providers: [
    // provideZonelessChangeDetection(), // using Zone.js instead for better compatibility
    provideRouter(routes, withHashLocation()),
    importProvidersFrom(ReactiveFormsModule), provideServiceWorker('ngsw-worker.js', {
            enabled: !isDevMode(),
            registrationStrategy: 'registerWhenStable:30000'
          })
  ]
}).catch(err => console.error(err));

// AI Studio always uses an `main.ts` file for all project types.
