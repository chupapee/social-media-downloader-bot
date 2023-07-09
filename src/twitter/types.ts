interface TweetVideo {
	variants: {
		bitrate: number;
		url: string;
	}[];
}

interface TweetMedia {
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
	user_results: {
		result: {
			legacy: {
				name?: string;
				screen_name: string;
			};
		};
	};
}

export interface TwitterResponse {
	data?: {
		tweetResult: {
			result: {
				core: TweetAuthor;
				views: {
					count: number;
				};
				legacy: TweetInfo;
				quoted_status_result?: {
					result: {
						legacy: TweetInfo;
						core: TweetAuthor;
					};
				};
			};
		};
	};
}
