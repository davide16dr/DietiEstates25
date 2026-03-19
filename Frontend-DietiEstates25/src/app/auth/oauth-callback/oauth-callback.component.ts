import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';







@Component({
  selector: 'app-oauth-callback',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif;color:#555">
      <div style="text-align:center">
        <div style="font-size:2rem;margin-bottom:1rem">⏳</div>
        <p>Autenticazione in corso...</p>
        <p style="font-size:.85rem;color:#999">Questa finestra si chiuderà automaticamente.</p>
      </div>
    </div>
  `,
})
export class OAuthCallbackComponent implements OnInit {
  ngOnInit(): void {
    const params = new URLSearchParams(window.location.search);
    const code  = params.get('code');
    const state = params.get('state');
    const error = params.get('error');

    if (window.opener) {
      window.opener.postMessage(
        { type: 'GITHUB_OAUTH_CODE', code, state, error },
        window.location.origin
      );
      window.close();
    } else {
      
      window.location.href = '/auth/login';
    }
  }
}
