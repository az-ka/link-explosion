import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { url } = await request.json();

		const response = await fetch(url, {
			method: 'HEAD',
			redirect: 'follow'
		});

		const metadata = {
			contentType: response.headers.get('content-type'),
			lastModified: response.headers.get('last-modified'),
			contentLength: response.headers.get('content-length'),
			server: response.headers.get('server'),
			timestamp: new Date().toISOString()
		};

		return json({
			success: true,
			expandedUrl: response.url,
			metadata
		});
	} catch {
		return json(
			{
				success: false,
				error: 'Gagal mengekspand URL'
			},
			{ status: 500 }
		);
	}
};
