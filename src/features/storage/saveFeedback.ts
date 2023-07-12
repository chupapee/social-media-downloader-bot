import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { User } from 'typegram';

import { db } from '../../shared/config';

interface Feedback {
	author: User;
	message: string;
}

export const saveFeedback = async (feedback: Feedback) => {
	const feedbackRef = doc(db, 'users', 'feedback');

	try {
		const oldResp = (await getDoc(feedbackRef)).data() as {
			list: Feedback[];
		};
		await updateDoc(feedbackRef, {
			list: [...oldResp.list, feedback],
		});
		console.log('FEEDBACK SAVED SUCCESSFULLY');
	} catch (error) {
		console.error(error, 'SAVING FEEDBACK FAILED');
	}
};
