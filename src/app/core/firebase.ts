import { initializeApp } from 'firebase/app';

/**
 * Configuración web de Firebase (proyecto basedex-fan). No es secreta: identifica el proyecto ante Firebase Auth;
 * la seguridad la ponen la verificación del token en la API y los dominios autorizados en la consola.
 */
export const firebaseApp = initializeApp({
  apiKey: 'AIzaSyCMnAb0BSDsPdul7bjTSa8F9Q5kiPaHYhc',
  authDomain: 'basedex-fan.firebaseapp.com',
  projectId: 'basedex-fan',
  appId: '1:302188601961:web:b9e6fc85330b5a561d78f8',
  messagingSenderId: '302188601961',
});
