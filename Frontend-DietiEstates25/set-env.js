const fs = require('fs');
const dotenv = require('dotenv');

// Carica le variabili dal file .env
dotenv.config();

const targetPath = './src/environments/environment.ts';
const indexHtmlPath = './src/index.html';

// Determine if this is a production build
const isProduction = process.env.CONFIGURATION === 'production' || process.env.NODE_ENV === 'production';

const envConfigFile = `export const environment = {
  production: ${isProduction},
  googleMapsApiKey: '${process.env.GOOGLE_MAPS_API_KEY || 'AIzaSyD0uk6UxgGRBC0aqQm96F1oG0R1ZMs1Usg'}',
  apiUrl: '${process.env.API_URL || 'https://dietiestates25-2-env.eba-kzrqphfm.eu-south-1.elasticbeanstalk.com/api'}',
  
  // OAuth Configuration
  oauth: {
    google: {
      clientId: '${process.env.GOOGLE_CLIENT_ID || '629289116262-r5fhjrhapcf075f11edh27q9jmfthnlv.apps.googleusercontent.com'}'
    },
    github: {
      clientId: '${process.env.GITHUB_CLIENT_ID || 'Ov23liBwCrSrz7hwJm9d'}'
    },
    facebook: {
      appId: '${process.env.FACEBOOK_APP_ID || '817657888033157'}'
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
    console.log(`   API URL: ${process.env.API_URL || 'https://dietiestates25-2-env.eba-kzrqphfm.eu-south-1.elasticbeanstalk.com/api'}`);
    console.log(`   Production: ${isProduction}`);
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
    process.env.GOOGLE_MAPS_API_KEY || 'AIzaSyD0uk6UxgGRBC0aqQm96F1oG0R1ZMs1Usg'
  );

  fs.writeFile(indexHtmlPath, result, 'utf8', (err) => {
    if (err) {
      console.error('❌ Errore nella scrittura del file index.html:', err);
    } else {
      console.log('✅ File index.html aggiornato con successo con la chiave API');
    }
  });
});
