import { doc, updateDoc } from 'firebase/firestore';

import { db } from '../../shared/config';

export const toggleBotUpFlag = async () => {
	const usersRef = doc(db, 'users', 'list');
	try {
		await updateDoc(usersRef, { socialBotUpFlag: true });
	} catch (error) {
		console.log(error, 'SAVING USER FAILED');
	}
};
