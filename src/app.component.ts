
import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.component.html',
  styles: []
})
export class AppComponent {
  authService = inject(AuthService);
  router = inject<Router>(Router);

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
