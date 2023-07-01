import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

import { ConfigService } from './config.service';

const apiKey = new ConfigService().get('FIREBASE_API_KEY');
const messagingSenderId = new ConfigService().get('MESSAGING_SENDER_ID');
const appId = new ConfigService().get('APP_ID');
const measurementId = new ConfigService().get('MEASUREMENT_ID');

export const firebaseConfig = {
	apiKey,
	authDomain: 'awesome-football-stats.firebaseapp.com',
	projectId: 'awesome-football-stats',
	storageBucket: 'awesome-football-stats.appspot.com',
	messagingSenderId,
	appId,
	measurementId,
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
