// ⚠️ QUESTO È UN FILE TEMPLATE
// Copia questo file in environment.ts e inserisci le tue chiavi API reali

export const environment = {
  production: false,
  googleMapsApiKey: 'YOUR_GOOGLE_MAPS_API_KEY_HERE',
  apiUrl: 'http://dietiestates25-2-env.eba-kzrqphfm.eu-south-1.elasticbeanstalk.com/api',
  
  // OAuth Configuration
  oauth: {
    google: {
      clientId: 'YOUR_GOOGLE_CLIENT_ID_HERE'
    },
    github: {
      clientId: 'YOUR_GITHUB_CLIENT_ID_HERE'
    },
    facebook: {
      appId: 'YOUR_FACEBOOK_APP_ID_HERE'
    }
  }
};
