import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-saved-searches',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-card">
      <h2>Ricerche Salvate</h2>
      <p>Lista ricerche salvate, modifica/elimini e alert.</p>
    </div>
  `,
  styles: [`
    .page-card{ background:#fff; border:1px solid #eceef0; border-radius:16px; padding:18px; }
    h2{ margin:0 0 6px; font-weight:900; }
    p{ margin:0; color:#6b7280; }
  `]
})
export class SavedSearchesComponent {}
