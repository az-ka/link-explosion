import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { performSecurityCheck } from '$lib/security/urlScanner';
import { expandUrl } from '$lib/utils/urlExpander';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { url } = await request.json();

		try {
			new URL(url);
		} catch {
			return json(
				{
					success: false,
					error: 'Invalid URL format'
				},
				{ status: 400 }
			);
		}

		const [securityResult, metadata] = await Promise.all([
			performSecurityCheck(url),
			expandUrl(url)
		]);

		return json({
			success: true,
			security: securityResult,
			metadata: metadata,
			expandedUrl: metadata.finalUrl
		});
	} catch (error) {
		return json(
			{
				success: false,
				error: error instanceof Error ? error.message : 'Failed to process URL',
				details:
					error instanceof Error
						? {
								name: error.name,
								message: error.message,
								stack: error.stack
							}
						: undefined
			},
			{ status: 500 }
		);
	}
};
