
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  template: `
    <div class="min-h-screen bg-brand-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div class="sm:mx-auto sm:w-full sm:max-w-md">
        <div class="flex justify-center">
          <div class="bg-brand-600 rounded-full p-4 shadow-lg">
             <svg class="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0z" />
             </svg>
          </div>
        </div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-brand-900">
          {{ isRegistering() ? 'Create Account' : 'Foresta POS Login' }}
        </h2>
        <p class="mt-2 text-center text-sm text-brand-700">
          {{ isRegistering() ? 'Register your restaurant' : 'Sign in to manage orders' }}
        </p>
      </div>

      <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div class="bg-white py-8 px-4 shadow-xl sm:rounded-lg sm:px-10 border border-brand-100">
          
          @if (errorMsg()) {
            <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 text-sm">
              {{ errorMsg() }}
            </div>
          }

          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="space-y-6">
            
            @if(isRegistering()) {
              <div>
                <label class="block text-sm font-medium text-gray-700">Business Name</label>
                <div class="mt-1">
                  <input type="text" formControlName="name" class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm">
                </div>
              </div>
            }

            <div>
              <label class="block text-sm font-medium text-gray-700">Email Address</label>
              <div class="mt-1">
                <input type="email" formControlName="email" class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm">
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700">Password</label>
              <div class="mt-1">
                <input type="password" formControlName="password" class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm">
              </div>
            </div>

            <div>
              <button type="submit" [disabled]="loginForm.invalid || isLoading()" class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50 transition-colors">
                @if (isLoading()) {
                  <span class="animate-spin mr-2">⟳</span> Processing...
                } @else {
                  {{ isRegistering() ? 'Register' : 'Login' }}
                }
              </button>
            </div>
          </form>

         

          <div class="mt-6">
             <div class="relative">
                <div class="absolute inset-0 flex items-center">
                  <div class="w-full border-t border-gray-300"></div>
                </div>
                <div class="relative flex justify-center text-sm">
                  <span class="px-2 bg-white text-gray-500">Or</span>
                </div>
             </div>
             <div class="mt-6 flex justify-center">
                <button (click)="toggleMode()" class="text-brand-600 hover:text-brand-500 font-medium text-sm">
                  {{ isRegistering() ? 'Already have an account? Login' : 'New here? Create Account' }}
                </button>
             </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  fb = inject(FormBuilder);
  authService = inject(AuthService);
  router = inject<Router>(Router);
  
  isLoading = signal(false);
  isRegistering = signal(false);
  errorMsg = signal('');

  // Pre-fill for convenience
  loginForm = this.fb.group({
    name: [''], 
    email: ['admin@foresta.com', [Validators.required, Validators.email]],
    password: ['password', [Validators.required, Validators.minLength(6)]]
  });

  toggleMode() {
    this.isRegistering.update(v => !v);
    this.errorMsg.set('');
    
    // Clear form when switching to register, but keep demo credentials for login mode
    if (this.isRegistering()) {
        this.loginForm.reset();
    } else {
        this.loginForm.patchValue({
            email: 'admin@foresta.com',
            password: 'password'
        });
    }
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.isLoading.set(true);
      this.errorMsg.set('');
      
      const { email, password, name } = this.loginForm.value;
      
      setTimeout(() => {
        let success = false;
        
        if (this.isRegistering()) {
          success = this.authService.register({ 
            email: email!, 
            password: password!, 
            name: name || 'Manager' 
          });
          if (!success) this.errorMsg.set('Email already exists!');
        } else {
          success = this.authService.login(email!, password!);
          if (!success) this.errorMsg.set('Invalid email or password');
        }

        if (success) {
          this.router.navigate(['/dashboard']);
        }
        this.isLoading.set(false);
      }, 800);
    }
  }
}
