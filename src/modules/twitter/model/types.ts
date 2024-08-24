export interface TweetVideo {
	variants: {
		content_type: string;
		bitrate: number;
		url: string;
	}[];
}

export interface TweetMedia {
	media_url_https: string;
	type: 'photo' | 'video' | 'animated_gif';
	video_info?: TweetVideo;
}

export interface TweetInfo {
	full_text: string;
	reply_count: number;

	favorite_count: number;
	retweet_count: number;
	quote_count: number;
	bookmark_count: number;

	extended_entities?: {
		media: TweetMedia[];
	};
}

interface TweetAuthor {
	name?: string;
	screen_name: string;
}

export interface TweetJson {
	data?: {
		tweetResult: {
			result: {
				__typename: 'TweetUnavailable' | 'Tweet';
				core: {
					user_results: {
						result: {
							legacy: TweetAuthor;
						};
					};
				};
				views: {
					count: number;
				};
				legacy: TweetInfo;
				quoted_status_result?: {
					result: {
						legacy: TweetInfo;
						core: {
							user_results: {
								result: {
									legacy: TweetAuthor;
								};
							};
						};
					};
				};
			};
		};
	};
}
