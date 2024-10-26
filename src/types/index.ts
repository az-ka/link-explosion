export type TLinkHistory = {
	originalUrl: string;
	expandedUrl: string;
	metadata: TMetadata;
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
