export interface InstaLink {
	type: string;
	href: string;
	source?: string;
}

export interface YouTubeLink {
	title?: string;
	descr?: string;
	quality: string;
	href: string;
}

export interface TwitterLink {
	quality: string;
	href: string;
}
