import { User } from 'typegram';

import { doc, getDoc, updateDoc } from '@firebase/firestore';
import { db } from '@shared/config';
import { notifyAdmin } from '@shared/notifyAdmin';

import { DatabaseEntities } from '../model/types';

const USERS_REF = doc(db, 'users', 'list');

export const getUsers = async () => {
	try {
		const response = await getDoc(USERS_REF);
		const users = response.data() as DatabaseEntities;
		return users['social-media-bot'];
	} catch (error) {
		console.error(error, 'GETTING DB USERS FAILED');
	}
};

/** Some symbols aren't allowed in the database
 * so they should be stringified first
 */
const toWritableObj = (object: unknown) => JSON.parse(JSON.stringify(object));

const isUserExist = (user: User, usersList: User[]) => {
	return usersList.some(({ id }) => id === user.id);
};

export const saveUser = async (user: User) => {
	const usersList = await getUsers();
	if (usersList !== undefined) {
		if (isUserExist(user, usersList)) return;

		notifyAdmin({
			text: `✨ New user added: ${JSON.stringify(user, null, 2)}`,
		});
		const updatedUsersList = [...usersList, toWritableObj(user)];
		try {
			await updateDoc(USERS_REF, {
				'social-media-bot': updatedUsersList,
			});
			console.log('USER SAVED SUCCESSFULLY');
		} catch (error) {
			console.error(error, 'SAVING USER IN DB FAILED');
		}
	}
};
