import type { TSecurityCheckResult } from '../../types';

export async function performSecurityCheck(url: string): Promise<TSecurityCheckResult> {
	const risks: string[] = [];
	let score = 100; // Start with perfect score

	// Initialize security details
	const details = {
		ssl: false,
		age: null,
		suspiciousPatterns: [] as string[],
		maliciousKeywords: false,
		redirectCount: 0,
		contentSecurityPolicy: false,
		xssProtection: false
	};

	// Check SSL/HTTPS
	details.ssl = url.toLowerCase().startsWith('https://');
	if (!details.ssl) {
		risks.push('No SSL/HTTPS encryption');
		score -= 30;
	}

	try {
		// Fetch with timeout and proper headers
		const response = await fetch(url, {
			method: 'HEAD',
			redirect: 'follow',
			headers: {
				'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
				Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
			},
			signal: AbortSignal.timeout(10000)
		});

		// Check security headers
		const headers = response.headers;

		// Content Security Policy
		details.contentSecurityPolicy = headers.has('content-security-policy');
		if (!details.contentSecurityPolicy) {
			risks.push('Missing Content Security Policy');
			score -= 10;
		}

		// XSS Protection
		details.xssProtection = headers.has('x-xss-protection');
		if (!details.xssProtection) {
			risks.push('Missing XSS Protection');
			score -= 10;
		}

		// Check for suspicious URL patterns
		const suspiciousPatterns = [
			/[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+/, // IP addresses
			/[^a-zA-Z0-9-.]/, // Special characters
			/(free|win|lucky|prize|money).{0,10}(offer|now|today|limited)/i, // Suspicious keywords
			/\.(ru|cn|tk|ga|ml|cf|gq|top)$/ // Suspicious TLDs
		];

		suspiciousPatterns.forEach((pattern) => {
			if (pattern.test(url)) {
				details.suspiciousPatterns.push(pattern.toString());
				risks.push('Suspicious URL pattern detected');
				score -= 15;
			}
		});

		// Check redirect count
		if (response.redirected) {
			details.redirectCount = countRedirects(response);
			if (details.redirectCount > 2) {
				risks.push('Multiple redirects detected');
				score -= 10;
			}
		}

		// Malicious keywords check in HTML
		if (response.headers.get('content-type')?.includes('text/html')) {
			const text = await response.text();
			const maliciousKeywords = [
				'phishing',
				'password',
				'credit card',
				'bank account',
				'social security',
				'verify your account'
			];

			details.maliciousKeywords = maliciousKeywords.some((keyword) =>
				text.toLowerCase().includes(keyword)
			);

			if (details.maliciousKeywords) {
				risks.push('Suspicious keywords detected in content');
				score -= 20;
			}
		}
	} catch {
		risks.push('Failed to fetch URL content');
		score -= 50;
	}

	return {
		isSafe: score >= 70,
		risks,
		score,
		details
	};
}

function countRedirects(response: Response): number {
	// Count redirects from response chain
	let count = 0;
	let currentUrl = response.url;
	while (response.redirected && currentUrl !== response.url) {
		count++;
		currentUrl = response.url;
	}
	return count;
}
