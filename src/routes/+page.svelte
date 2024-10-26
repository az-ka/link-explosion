<script lang="ts">
	import { onMount } from 'svelte';
	import type { TLinkHistory, TLinkState, TMetadata } from '../types';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import Label from '$lib/components/ui/label/label.svelte';
	import PreviewImage from '$lib/components/PreviewImage.svelte';

	const linkState = $state<TLinkState>({
		originalUrl: '',
		expandedUrl: '',
		metadata: null,
		loading: false,
		error: null,
		history: []
	});

	async function expandUrl() {
		try {
			linkState.loading = true;
			linkState.error = null;

			if (!isValidUrl(linkState.originalUrl)) {
				throw new Error('URL tidak valid');
			}

			console.log('Sending request for URL:', linkState.originalUrl);

			const response = await fetch('/api/expand', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ url: linkState.originalUrl })
			});

			const data = await response.json();
			console.log('Response data:', data);

			if (!data.success) {
				throw new Error(data.error || 'Terjadi kesalahan saat mengekspand URL');
			}

			linkState.expandedUrl = data.expandedUrl;
			linkState.metadata = data.metadata;

			// Update history
			const newHistoryEntry = {
				originalUrl: linkState.originalUrl,
				expandedUrl: data.expandedUrl,
				metadata: data.metadata,
				timestamp: new Date()
			};

			linkState.history = [newHistoryEntry, ...linkState.history].slice(0, 10);
			localStorage.setItem('linkHistory', JSON.stringify(linkState.history));
		} catch (error) {
			console.error('Error in expandUrl:', error);
			linkState.error = {
				message: error instanceof Error ? error.message : 'Terjadi kesalahan yang tidak diketahui',
				status: 500,
				details: error instanceof Error ? error.stack : undefined
			};
		} finally {
			linkState.loading = false;
		}
	}

	function isValidUrl(string: string) {
		try {
			new URL(string);
			return true;
		} catch {
			return false;
		}
	}

	onMount(() => {
		const savedHistory = localStorage.getItem('linkHistory');
		if (savedHistory) {
			linkState.history = JSON.parse(savedHistory);
		}
	});
</script>

<div
	class="min-h-screen bg-[#fcfcfd] flex flex-col justify-between items-center relative overflow-hidden sm:py-12"
>
	<h1 class="text-2xl font-bold">Exp</h1>

	<div class="max-w-7xl mx-auto py-20">
		<div
			class="relative px-7 py-6 bg-white ring-1 ring-gray-900/5 rounded-lg leading-none flex flex-col items-top justify-start space-x-6"
		>
			<h2 class="text-2xl font-bold text-center text-gray-800 md:text-3xl">Let's Go</h2>

			<p class="mt-2 text-center text-gray-500 md:mt-4">
				Enter a URL to expand it and get metadata information.
			</p>

			<div class="space-y-2">
				<Label for="email">URL</Label>
				<Input bind:value={linkState.originalUrl} placeholder="Enter a URL to expand..." />

				<Button class="w-full" onclick={expandUrl} disabled={linkState.loading}
					>{linkState.loading ? 'Memproses...' : 'Expand URL'}</Button
				>
			</div>

			{#if linkState.expandedUrl}
				<div class="mt-6">
					<h2 class="text-xl font-semibold mb-2">Hasil:</h2>
					<div class="p-4 rounded">
						<p class="mb-2"><strong>URL Asli:</strong> {linkState.originalUrl}</p>
						<p class="mb-2"><strong>URL Lengkap:</strong> {linkState.expandedUrl}</p>

						{#if linkState.metadata}
							<div class="mt-4">
								<h3 class="font-semibold mb-2">Metadata:</h3>
								<ul class="text-sm">
									<li>Content Type: {linkState.metadata.contentType}</li>
									<li>Last Modified: {linkState.metadata.lastModified}</li>
									<li>Size: {linkState.metadata.contentLength} bytes</li>
									<li>Server: {linkState.metadata.server}</li>
								</ul>

								{#if linkState.metadata.previewUrl}
									<div class="mt-4">
										<h3 class="font-semibold mb-2">Preview:</h3>
										<div class="max-w-md">
											<PreviewImage
												url={linkState.metadata.previewUrl}
												alt={`Preview for ${linkState.originalUrl}`}
											/>
										</div>
									</div>
								{/if}
							</div>
						{/if}
					</div>
				</div>
			{/if}
		</div>

		<div class="container px-4 py-20 mx-auto">
			<div class="flex flex-col items-center text-center">
				<h2
					class="text-3xl font-bold text-transparent bg-gradient-to-r from-sky-500 via-blue-500 to-blue-600 bg-clip-text"
				>
					History
				</h2>
				<p class="mt-4 text-gray-500">You can see the last 10 URLs you've expanded here.</p>
			</div>

			{#if linkState.history.length > 0}
				<div class="p-6 rounded-lg shadow-md">
					<h2 class="text-xl font-semibold mb-4">Riwayat URL</h2>
					<div class="space-y-4">
						{#each linkState.history as item}
							<div class="border-b pb-4">
								<p class="text-sm text-gray-600">
									{new Date(item.timestamp).toLocaleString()}
								</p>
								<p class="mb-1"><strong>Original:</strong> {item.originalUrl}</p>
								<p class="mb-2"><strong>Expanded:</strong> {item.expandedUrl}</p>
								{#if item.metadata.previewUrl}
									<div class="max-w-md">
										<PreviewImage
											url={item.metadata.previewUrl}
											alt={`Preview for ${item.originalUrl}`}
										/>
									</div>
								{/if}
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	</div>

	<h1 class="">Exp</h1>
</div>
