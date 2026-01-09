
import { Injectable, signal } from '@angular/core';

export interface User {
  email: string;
  name: string;
  password?: string; // Stored only for this client-side demo
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private userKey = 'dhaba_pos_users';
  private sessionKey = 'dhaba_pos_session';

  currentUser = signal<User | null>(this.loadSession());

  register(user: User): boolean {
    const users = this.getUsers();
    if (users[user.email]) {
      return false; // User exists
    }
    users[user.email] = user;
    localStorage.setItem(this.userKey, JSON.stringify(users));
    // Auto login
    this.setSession(user);
    return true;
  }

  login(email: string, password: string): boolean {
    const users = this.getUsers();
    const user = users[email];
    
    if (user && user.password === password) {
      this.setSession(user);
      return true;
    }
    return false;
  }

  logout() {
    this.currentUser.set(null);
    localStorage.removeItem(this.sessionKey);
  }

  // --- Data Management for Backup/Restore ---

  getBackupData() {
    return this.getUsers();
  }

  restoreBackupData(users: Record<string, User>) {
    if (!users) return;
    const current = this.getUsers();
    // Merge users, keeping existing ones if conflict
    const merged = { ...current, ...users };
    localStorage.setItem(this.userKey, JSON.stringify(merged));
  }

  // --- Internal Methods ---

  private setSession(user: User) {
    const safeUser = { ...user };
    delete safeUser.password; // Don't keep password in session signal
    this.currentUser.set(safeUser);
    localStorage.setItem(this.sessionKey, JSON.stringify(safeUser));
  }

  private loadSession(): User | null {
    const stored = localStorage.getItem(this.sessionKey);
    return stored ? JSON.parse(stored) : null;
  }

  private getUsers(): Record<string, User> {
    const stored = localStorage.getItem(this.userKey);
    if (stored) {
      return JSON.parse(stored);
    }
    
    // Create Default Admin User if system is empty
    const demoUser: User = {
        email: 'admin@foresta.com',
        name: 'Foresta',
        password: 'password'
    };
    const initialUsers = { [demoUser.email]: demoUser };
    localStorage.setItem(this.userKey, JSON.stringify(initialUsers));
    return initialUsers;
  }
}
