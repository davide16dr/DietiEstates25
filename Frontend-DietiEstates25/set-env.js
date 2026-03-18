const fs = require('fs');
const dotenv = require('dotenv');

// Carica le variabili dal file .env
dotenv.config();

const targetPath = './src/environments/environment.ts';
const indexHtmlPath = './src/index.html';

const envConfigFile = `export const environment = {
  production: false,
  googleMapsApiKey: '${process.env.GOOGLE_MAPS_API_KEY}',
  apiUrl: '${process.env.API_URL}',
  
  // OAuth Configuration
  oauth: {
    google: {
      clientId: '${process.env.GOOGLE_CLIENT_ID}'
    },
    github: {
      clientId: '${process.env.GITHUB_CLIENT_ID}'
    },
    facebook: {
      appId: '${process.env.FACEBOOK_APP_ID}'
    }
  }
};
`;

// Aggiorna environment.ts
fs.writeFile(targetPath, envConfigFile, (err) => {
  if (err) {
    console.error('❌ Errore nella scrittura del file environment.ts:', err);
  } else {
    console.log('✅ File environment.ts aggiornato con successo dalla variabile .env');
  }
});

// Aggiorna index.html sostituendo il placeholder con la chiave API
fs.readFile(indexHtmlPath, 'utf8', (err, data) => {
  if (err) {
    console.error('❌ Errore nella lettura del file index.html:', err);
    return;
  }

  const result = data.replace(
    /__GOOGLE_MAPS_API_KEY__/g,
    process.env.GOOGLE_MAPS_API_KEY || ''
  );

  fs.writeFile(indexHtmlPath, result, 'utf8', (err) => {
    if (err) {
      console.error('❌ Errore nella scrittura del file index.html:', err);
    } else {
      console.log('✅ File index.html aggiornato con successo con la chiave API');
    }
  });
});
