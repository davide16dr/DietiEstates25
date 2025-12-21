import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { environment } from '../environments/environment';

const script = document.createElement('script');
script.src = `https://maps.googleapis.com/maps/api/js?key=${environment.googleMapsApiKey}&v=weekly`;
script.defer = true;
document.head.appendChild(script);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes)
  ]
};
