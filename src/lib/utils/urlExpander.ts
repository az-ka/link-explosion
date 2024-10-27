import type { TMetadata } from '../../types';

export async function expandUrl(url: string): Promise<TMetadata> {
	try {
		// Coba HEAD request dulu
		const headResponse = await fetch(url, {
			method: 'HEAD',
			redirect: 'follow',
			headers: {
				'User-Agent':
					'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
			},
			signal: AbortSignal.timeout(10000)
		}).catch(async (headError) => {
			console.log('HEAD request failed, falling back to GET:', headError);
			// Fallback ke GET request jika HEAD gagal
			return await fetch(url, {
				method: 'GET',
				redirect: 'follow',
				headers: {
					'User-Agent':
						'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
				},
				signal: AbortSignal.timeout(10000)
			});
		});

		if (!headResponse.ok) {
			throw new Error(`HTTP error! status: ${headResponse.status}`);
		}

		const contentType = headResponse.headers.get('content-type');
		let previewUrl = null;
		let previewType = null;
		let faviconUrl = null;
		let title = null;
		let description = null;

		// Jika kontennya gambar, gunakan URL gambar sebagai preview
		if (contentType?.startsWith('image/')) {
			previewUrl = headResponse.url;
			previewType = 'image';
		} else {
			// Jika bukan gambar, ambil metadata dari HTML
			const fullResponse = await fetch(url, {
				redirect: 'follow',
				headers: {
					'User-Agent':
						'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
				},
				signal: AbortSignal.timeout(10000)
			});

			const html = await fullResponse.text();

			// Ekstrak metadata dari HTML
			const ogImageMatch = html.match(/]*property="og:image"[^>]*content="([^"]*)"[^>]*>/i);
			const twitterImageMatch = html.match(/]*name="twitter:image"[^>]*content="([^"]*)"[^>]*>/i);
			const faviconMatch = html.match(/]*rel="(?:shortcut )?icon"[^>]*href="([^"]*)"[^>]*>/i);
			const titleMatch = html.match(/]*>([^<]*)<\/title>/i);
			const descriptionMatch = html.match(/]*name="description"[^>]*content="([^"]*)"[^>]*>/i);

			// Ambil preview image dari og:image atau twitter:image
			if (ogImageMatch) {
				previewUrl = new URL(ogImageMatch[1], url).href;
				previewType = 'image';
			} else if (twitterImageMatch) {
				previewUrl = new URL(twitterImageMatch[1], url).href;
				previewType = 'image';
			}

			// Ambil favicon jika ada
			if (faviconMatch) {
				faviconUrl = new URL(faviconMatch[1], url).href;
			}

			// Ambil title dan description
			if (titleMatch) {
				title = titleMatch[1].trim();
			}

			if (descriptionMatch) {
				description = descriptionMatch[1].trim();
			}
		}

		// Kembalikan metadata lengkap
		return {
			contentType,
			lastModified: headResponse.headers.get('last-modified'),
			contentLength: headResponse.headers.get('content-length'),
			server: headResponse.headers.get('server'),
			timestamp: new Date().toISOString(),
			previewUrl,
			previewType,
			faviconUrl,
			title,
			description,
			finalUrl: headResponse.url
		};
	} catch (error) {
		throw new Error(
			`Failed to expand URL: ${error instanceof Error ? error.message : 'Unknown error'}`
		);
	}
}
