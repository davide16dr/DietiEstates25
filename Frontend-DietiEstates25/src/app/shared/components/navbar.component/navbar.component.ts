import { Component, input, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent {
  private authService = inject(AuthService);
  
  // Rimuovo l'input e uso un computed signal per controllare dinamicamente l'autenticazione
  showAuthActions = computed(() => !this.authService.isAuthenticated());
  
  brandText = input<string>('DietiEstates');
  brandSuffix = input<string>('25');
}