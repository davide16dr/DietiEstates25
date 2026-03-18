import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, throwError } from 'rxjs';
import { tap, switchMap } from 'rxjs/operators';
import { AuthService, AuthResponse } from './auth.service';
import { environment } from '../../../environments/environment'; // ✅ AGGIUNTO

export type OAuthProvider = 'google' | 'github' | 'facebook';

// Dichiarazioni per le API globali iniettate via script
declare const google: any;
declare const FB: any;

@Injectable({ providedIn: 'root' })
export class OAuthService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  private readonly BACKEND_URL = `${environment.apiUrl.replace('/api', '')}/auth/oauth`;

  // ✅ CORRETTO: Legge da environment.ts invece di (window as any).__env
  private readonly GOOGLE_CLIENT_ID  = environment.oauth?.google?.clientId ?? '';
  private readonly GITHUB_CLIENT_ID  = environment.oauth?.github?.clientId ?? '';
  private readonly FACEBOOK_APP_ID   = environment.oauth?.facebook?.appId ?? '';

  // ─────────────────────────────────────────────────────────────────────────
  // ENTRY POINT
  // ─────────────────────────────────────────────────────────────────────────

  login(provider: OAuthProvider): Observable<AuthResponse> {
    switch (provider) {
      case 'google':   return this.loginWithGoogle();
      case 'github':   return this.loginWithGithub();
      case 'facebook': return this.loginWithFacebook();
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // GOOGLE – usa Google Identity Services (One Tap / popup)
  // ─────────────────────────────────────────────────────────────────────────

  private loginWithGoogle(): Observable<AuthResponse> {
    const clientId = this.GOOGLE_CLIENT_ID;
    if (!clientId) {
      return throwError(() => new Error('Google Client ID non configurato. Imposta GOOGLE_CLIENT_ID in environment.ts.'));
    }

    return from(this.googlePopup(clientId)).pipe(
      switchMap((idToken: string) => this.sendToBackend('google', idToken))
    );
  }

  private googlePopup(clientId: string): Promise<string> {
    return new Promise((resolve, reject) => {
      if (typeof google === 'undefined') {
        reject(new Error('Google Identity Services script non caricato. Aggiungi il tag <script> in index.html.'));
        return;
      }

      google.accounts.id.initialize({
        client_id: clientId,
        callback: (response: any) => {
          if (response?.credential) {
            resolve(response.credential);
          } else {
            reject(new Error('Nessun credential ricevuto da Google'));
          }
        },
        cancel_on_tap_outside: true,
      });

      google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          // Fallback: apri il popup
          google.accounts.oauth2.initTokenClient({
            client_id: clientId,
            scope: 'openid email profile',
            callback: (tokenResponse: any) => {
              if (tokenResponse?.access_token) {
                // Scambia access_token con id_token tramite tokeninfo
                fetch(`https://oauth2.googleapis.com/tokeninfo?access_token=${tokenResponse.access_token}`)
                  .then(r => r.json())
                  .then(info => {
                    if (info.email) {
                      // Costruisci un id_token dal token client OAuth2
                      resolve(tokenResponse.id_token ?? tokenResponse.access_token);
                    } else {
                      reject(new Error('Token Google non valido'));
                    }
                  })
                  .catch(reject);
              } else {
                reject(new Error('Nessun token ricevuto da Google'));
              }
            },
          }).requestAccessToken();
        }
      });
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // GITHUB – apre un popup OAuth, attende il codice dalla callback page
  // ─────────────────────────────────────────────────────────────────────────

  private loginWithGithub(): Observable<AuthResponse> {
    const clientId = this.GITHUB_CLIENT_ID;
    if (!clientId) {
      return throwError(() => new Error('GitHub Client ID non configurato. Imposta GITHUB_CLIENT_ID in environment.ts.'));
    }

    return from(this.githubPopup(clientId)).pipe(
      switchMap((code: string) => this.sendToBackend('github', code))
    );
  }

  private githubPopup(clientId: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const redirectUri = `${window.location.origin}/auth/oauth-callback`;
      const state = crypto.randomUUID();
      sessionStorage.setItem('github_oauth_state', state);

      const authUrl = `https://github.com/login/oauth/authorize`
        + `?client_id=${clientId}`
        + `&redirect_uri=${encodeURIComponent(redirectUri)}`
        + `&scope=user:email`
        + `&state=${state}`;

      const width  = 600, height = 700;
      const left   = window.screenX + (window.outerWidth  - width)  / 2;
      const top    = window.screenY + (window.outerHeight - height) / 2;
      const popup  = window.open(authUrl, 'github_oauth', `width=${width},height=${height},left=${left},top=${top}`);

      if (!popup) {
        reject(new Error('Impossibile aprire la finestra popup. Controlla il blocco popup del browser.'));
        return;
      }

      const handler = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        if (event.data?.type === 'GITHUB_OAUTH_CODE') {
          window.removeEventListener('message', handler);
          if (event.data.state !== state) {
            reject(new Error('State GitHub non corrispondente. Possibile attacco CSRF.'));
          } else if (event.data.code) {
            resolve(event.data.code);
          } else {
            reject(new Error(event.data.error ?? 'Autorizzazione GitHub negata'));
          }
        }
      };

      window.addEventListener('message', handler);

      // Timeout dopo 5 minuti
      setTimeout(() => {
        window.removeEventListener('message', handler);
        if (!popup.closed) popup.close();
        reject(new Error('Timeout autenticazione GitHub'));
      }, 5 * 60 * 1000);
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // FACEBOOK – usa Facebook JS SDK
  // ─────────────────────────────────────────────────────────────────────────

  private loginWithFacebook(): Observable<AuthResponse> {
    const appId = this.FACEBOOK_APP_ID;
    if (!appId) {
      return throwError(() => new Error('Facebook App ID non configurato. Imposta FACEBOOK_APP_ID in environment.ts.'));
    }

    return from(this.facebookPopup(appId)).pipe(
      switchMap((accessToken: string) => this.sendToBackend('facebook', accessToken))
    );
  }

  private facebookPopup(appId: string): Promise<string> {
    return new Promise((resolve, reject) => {
      if (typeof FB === 'undefined') {
        reject(new Error('Facebook JS SDK non caricato. Aggiungi il tag <script> in index.html.'));
        return;
      }

      FB.init({ appId, cookie: true, xfbml: true, version: 'v19.0' });

      FB.login((response: any) => {
        if (response?.authResponse?.accessToken) {
          resolve(response.authResponse.accessToken);
        } else {
          reject(new Error('Autorizzazione Facebook negata o annullata'));
        }
      }, { scope: 'public_profile,email' });
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CHIAMA IL BACKEND
  // ─────────────────────────────────────────────────────────────────────────

  private sendToBackend(provider: OAuthProvider, token: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(this.BACKEND_URL, { provider, token }).pipe(
      tap((res) => {
        localStorage.setItem('token', res.accessToken);
        localStorage.setItem('currentUser', JSON.stringify(res));
        // Aggiorna il signal di AuthService (accesso diretto tramite metodo pubblico)
        this.authService.setUserFromOAuth(res);
      })
    );
  }
}
