import { initializeApp } from 'firebase/app';

export const firebaseConfig = {
  apiKey: 'AIzaSyAZtdvpbzqbgBabd8tW9n7lpznVca6cpEQ',
  authDomain: 'polleria-dylan.firebaseapp.com',
  projectId: 'polleria-dylan',
  storageBucket: 'polleria-dylan.firebasestorage.app',
  messagingSenderId: '734415166155',
  appId: '1:734415166155:web:a093ccd44a2e239a8e994e',
  measurementId: 'G-BMKG14M0ZM'
};

export const app = initializeApp(firebaseConfig);