import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { User } from 'telegraf/typings/core/types/typegram';

import { db } from '../config/firebase.config';

interface IUserDb extends User {
	date: string;
	status: 'start' | 'end';
}

export type AppType = 'twitter' | 'insta' | 'you';

interface AllDbUsers {
	twitter: IUserDb[];
	insta: IUserDb[];
	you: IUserDb[];
	footballStats: User[];
	socialBotWokeCount: number;
}

export async function getUsers(): Promise<AllDbUsers | undefined>;
export async function getUsers(
	appType: AppType
): Promise<IUserDb[] | undefined>;

export async function getUsers(
	appType?: AppType
): Promise<IUserDb[] | AllDbUsers | undefined> {
	const usersRef = doc(db, 'users', 'list');
	try {
		const response = (await getDoc(usersRef)).data() as AllDbUsers;
		if (appType) return response[appType];
		return response;
	} catch (error) {
		console.log(error, 'GET USERS FAILED');
	}
}

export const updateBotWokeCount = async (updatedCount: number) => {
	const usersRef = doc(db, 'users', 'list');
	try {
		await updateDoc(usersRef, { socialBotWokeCount: updatedCount });
	} catch (error) {
		console.log(error, 'SAVING USER FAILED');
	}
};

async function saveUser(
	oldUsers: IUserDb[],
	newUser: IUserDb,
	appType: AppType
) {
	if (newUser.id !== 1333220153) {
		const usersRef = doc(db, 'users', 'list');
		try {
			await updateDoc(usersRef, {
				[appType]: [...oldUsers, JSON.parse(JSON.stringify(newUser))],
			});
			console.log('USER SAVED SUCCESSFULLY');
		} catch (error) {
			console.log(error, 'SAVING USER FAILED');
		}
	}
}

export async function startInteraction(user: User, appType: AppType) {
	const newUser: IUserDb = {
		...user,
		date: new Date().toLocaleString(),
		status: 'start',
	};

	try {
		const oldUsers = await getUsers(appType);
		if (oldUsers) await saveUser(oldUsers, newUser, appType);
	} catch (error) {
		console.log(error, 'USER START INTERACTION ERROR');
	}
}

export async function endInteraction(user: User, appType: AppType) {
	const newUser: IUserDb = {
		...user,
		date: new Date().toLocaleString(),
		status: 'end',
	};

	try {
		const oldUsers = await getUsers(appType);
		if (oldUsers) await saveUser(oldUsers, newUser, appType);
	} catch (error) {
		console.log(error, 'USER END INTERACTION ERROR');
	}
}
