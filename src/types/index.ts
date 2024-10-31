export type TLinkHistory = {
	originalUrl: string;
	expandedUrl: string;
	metadata: TMetadata;
	security: TSecurityCheckResult;
	timestamp: Date;
};

export type TMetadata = {
	contentType: string | null;
	lastModified: string | null;
	contentLength: string | null;
	server: string | null;
	timestamp: string;
	previewUrl: string | null;
	previewType: string | null;
	faviconUrl: string | null;
	title: string | null;
	description: string | null;
	finalUrl: string;
};

export type TError = {
	message: string;
	status: number;
	details?: string;
};

export type TLinkState = {
	originalUrl: string;
	expandedUrl: string;
	metadata: TMetadata | null;
	loading: boolean;
	error: TError | null;
	history: TLinkHistory[];
};

export type TSecurityCheckResult = {
	isSafe: boolean;
	risks: string[];
	score: number;
	details: {
		ssl: boolean;
		age: string | null;
		suspiciousPatterns: string[];
		maliciousKeywords: boolean;
		redirectCount: number;
		contentSecurityPolicy: boolean;
		xssProtection: boolean;
	};
};
