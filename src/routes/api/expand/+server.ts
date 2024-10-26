import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { url } = await request.json();
		
		console.log('Processing URL:', url);

		// Tambahkan timeout dan custom user-agent
		const headResponse = await fetch(url, {
			method: 'HEAD',
			redirect: 'follow',
			headers: {
				'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
			},
			signal: AbortSignal.timeout(10000) // 10 detik timeout
		}).catch(async (headError) => {
			console.log('HEAD request failed, falling back to GET:', headError);
			// Fallback ke GET request jika HEAD gagal
			return await fetch(url, {
				method: 'GET',
				redirect: 'follow',
				headers: {
					'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
				},
				signal: AbortSignal.timeout(10000)
			});
		});

		if (!headResponse.ok) {
			throw new Error(`HTTP error! status: ${headResponse.status}`);
		}

		const contentType = headResponse.headers.get('content-type');
		console.log('Content-Type:', contentType);
		console.log('Final URL:', headResponse.url);
		
		let previewUrl = null;
		let previewType = null;

		if (contentType?.startsWith('image/')) {
			previewUrl = headResponse.url;
			previewType = 'image';
		} else {
			// Jika bukan gambar, coba ambil halaman lengkap
			const fullResponse = await fetch(url, {
				redirect: 'follow',
				headers: {
					'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
				},
				signal: AbortSignal.timeout(10000)
			});

			if (!fullResponse.ok) {
				throw new Error(`HTTP error! status: ${fullResponse.status}`);
			}

			const html = await fullResponse.text();
			
			// Cari meta tags untuk preview image
			const ogImageMatch = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]*)"[^>]*>/i);
			const twitterImageMatch = html.match(/<meta[^>]*name="twitter:image"[^>]*content="([^"]*)"[^>]*>/i);
			
			if (ogImageMatch) {
				previewUrl = ogImageMatch[1];
				previewType = 'image';
			} else if (twitterImageMatch) {
				previewUrl = twitterImageMatch[1];
				previewType = 'image';
			}

			console.log('Preview URL found:', previewUrl);
		}

		const metadata = {
			contentType,
			lastModified: headResponse.headers.get('last-modified'),
			contentLength: headResponse.headers.get('content-length'),
			server: headResponse.headers.get('server'),
			timestamp: new Date().toISOString(),
			previewUrl,
			previewType
		};

		return json({
			success: true,
			expandedUrl: headResponse.url,
			metadata
		});
	} catch (error) {
		console.error('Detailed error:', error);
		
		return json(
			{
				success: false,
				error: error instanceof Error ? error.message : 'Gagal mengekspand URL',
				details: error instanceof Error ? {
					name: error.name,
					message: error.message,
					stack: error.stack
				} : undefined
			},
			{ status: 500 }
		);
	}
};