import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { User } from 'telegraf/typings/core/types/typegram';

import { BOT_AUTHOR_ID, db } from '../config';

interface IUserDb extends User {
	date: string;
	status: 'start' | 'end';
}

export type AppType = 'twitter' | 'insta' | 'you' | 'tiktok';

interface AllDbUsers {
	twitter: IUserDb[];
	insta: IUserDb[];
	you: IUserDb[];
	tiktok: IUserDb[];
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
	if (newUser.id !== BOT_AUTHOR_ID) {
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

interface Feedback {
	author: User;
	message: string;
}

export const sendFeedback = async (feedback: Feedback) => {
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
		console.log(error, 'SAVING FEEDBACK FAILED');
	}
};
