import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-my-visits',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-card">
      <h2>Le Mie Visite</h2>
      <p>Calendario/agenda visite programmate e storico.</p>
    </div>
  `,
  styles: [`
    .page-card{ background:#fff; border:1px solid #eceef0; border-radius:16px; padding:18px; }
    h2{ margin:0 0 6px; font-weight:900; }
    p{ margin:0; color:#6b7280; }
  `]
})
export class MyVisitsComponent {}
