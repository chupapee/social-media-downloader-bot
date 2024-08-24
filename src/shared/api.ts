export class ScrapingError extends Error {
	error: unknown;
	constructor(message: string, error: unknown) {
		super();
		this.name = this.constructor.name;
		this.message = message;
		this.error = error;
	}
}

export class UnknownError extends Error {
	public error: unknown;

	constructor(error: unknown) {
		super();
		this.name = this.constructor.name;
		this.error = error;
	}
}

export class WrongLinkError extends Error {
	constructor(message: string) {
		super();
		this.name = this.constructor.name;
		this.message = message;
	}
}

export class TooLargeMediaSize extends Error {
	constructor(message: string) {
		super();
		this.name = this.constructor.name;
		this.message = message;
	}
}
