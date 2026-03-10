import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { DashboardSidebarComponent } from '../dashboard-sidebar.component/dashboard-sidebar.component';
import { AuthService } from '../../../shared/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterOutlet, DashboardSidebarComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  readonly sidebarCollapsed = signal(false);

  private router = inject(Router);
  private auth = inject(AuthService);

  ngOnInit(): void {
    this.redirectIfRoot();
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => this.redirectIfRoot());
  }

  private redirectIfRoot(): void {
    const url = this.router.url.split('?')[0];
    if (url !== '/dashboard') return;

    const role = this.auth.currentUser()?.role?.toLowerCase();
    switch (role) {
      case 'admin':          this.router.navigateByUrl('/dashboard/admin-home', { replaceUrl: true }); break;
      case 'agency_manager': this.router.navigateByUrl('/dashboard/manager-home', { replaceUrl: true }); break;
      default:               this.router.navigateByUrl('/dashboard/home', { replaceUrl: true }); break;
    }
  }

  toggleSidebar() {
    this.sidebarCollapsed.update(v => !v);
  }
}
