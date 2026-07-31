/**
 * Firebase configuration.
 *
 * ⚠️  REPLACE the placeholder values below with your own Firebase project's
 *     Web App config. You can find these in the Firebase Console:
 *       Project settings → General → Your apps → SDK setup and configuration.
 *
 * This app uses the Firebase **Realtime Database**, so make sure
 * `databaseURL` is set correctly (it usually ends in `.firebasedatabase.app`
 * or `.firebaseio.com`).
 *
 * NOTE: This file lives under `src/environments/`, which is git-ignored, so your
 * keys stay out of source control. Firebase web config values are not secret,
 * but keeping them local keeps the repo clean.
 */
export const environment = {
  production: false,
  firebase: {
    apiKey: 'AIzaSyCXYfR6aEIry9aWenP6uq56t1x3bnHOZ3c',
    authDomain: 'spyfall-ca3e9.firebaseapp.com',
    databaseURL:
      'https://spyfall-ca3e9-default-rtdb.europe-west1.firebasedatabase.app',
    projectId: 'spyfall-ca3e9',
    storageBucket: 'spyfall-ca3e9.firebasestorage.app',
    messagingSenderId: '697370627312',
    appId: '1:697370627312:web:69403b97e886916bd90635',
    measurementId: 'G-SKQ7DWVTWR',
  },
};
