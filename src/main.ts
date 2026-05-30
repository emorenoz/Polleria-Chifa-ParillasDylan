import { bootstrapApplication } from '@angular/platform-browser';

import {
  provideIonicAngular,
  IonicRouteStrategy
} from '@ionic/angular/standalone';

import {
  RouteReuseStrategy,
  provideRouter
} from '@angular/router';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';

import {
  provideFirebaseApp,
  initializeApp
} from '@angular/fire/app';

import {
  provideAuth,
  getAuth
} from '@angular/fire/auth';

import {
  provideFirestore,
  getFirestore
} from '@angular/fire/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyAZtdvpbzqbgBabd8tW9n7lpznVca6cpEQ',
  authDomain: 'polleria-dylan.firebaseapp.com',
  projectId: 'polleria-dylan',
  storageBucket: 'polleria-dylan.firebasestorage.app',
  messagingSenderId: '734415166155',
  appId: '1:734415166155:web:a093ccd44a2e239a8e994e',
  measurementId: 'G-BMKG14M0ZM'
};

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },

    provideIonicAngular(),
    provideRouter(routes),

    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore())
  ]
});