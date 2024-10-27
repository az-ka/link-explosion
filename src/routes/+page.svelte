<script lang="ts">
	import { onMount } from 'svelte';
	import type { TLinkState } from '../types';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import Label from '$lib/components/ui/label/label.svelte';
	import PreviewImage from '$lib/components/PreviewImage.svelte';
	import * as Card from '$lib/components/ui/card';

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

			if (data.security.isSafe) {
				console.log('URL aman dengan skor:', data.security.score);
			} else {
				console.warn('URL mencurigakan! Risiko:', data.security.risks);
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

	function deleteHistoryItem(index: number) {
		linkState.history = linkState.history.filter((_, i) => i !== index);
		localStorage.setItem('linkHistory', JSON.stringify(linkState.history));
	}

	function formatDate(timestamp: string | number | Date) {
		const date = new Date(timestamp);
		const now = new Date();

		const isToday = date.toDateString() === now.toDateString();
		const isYesterday =
			date.toDateString() === new Date(now.setDate(now.getDate() - 1)).toDateString();
		const timeOptions: Intl.DateTimeFormatOptions = {
			hour: 'numeric',
			minute: 'numeric',
			hour12: true
		};
		const userLocale = navigator.language;
		const timeString = date.toLocaleTimeString(userLocale, timeOptions);

		if (isToday) {
			return `Today at ${timeString}`;
		} else if (isYesterday) {
			return `Yesterday at ${timeString}`;
		} else {
			const dateOptions: Intl.DateTimeFormatOptions = {
				year: 'numeric',
				month: '2-digit',
				day: '2-digit'
			};
			const dateString = date.toLocaleDateString(userLocale, dateOptions);
			return `${dateString} ${timeString}`;
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
	<div class="max-w-2xl mx-auto py-20 w-full">
		<div
			class="relative px-7 py-6 bg-white ring-1 ring-gray-900/5 rounded-lg leading-none flex flex-col items-top justify-start space-x-6"
		>
			<h2 class="text-2xl font-bold text-center text-gray-800 md:text-3xl">Let's Go</h2>

			<p class="mt-2 text-center text-gray-500 md:mt-4 mb-6">
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
				<h2 class="text-3xl font-bold">History</h2>
				<p class="mt-4 text-gray-500">You can see the last 10 URLs you've expanded here.</p>
			</div>

			{#if linkState.history.length > 0}
				<div class="space-y-4">
					{#each linkState.history as item, index}
						<Card.Root class="bg-white">
							<Card.Content>
								<div class="flex flex-row items-start gap-x-4">
									<img
										src={item.metadata?.faviconUrl || '/favicon.ico'}
										alt="Favicon"
										class="size-14 rounded-full border border-gray-200 p-2"
									/>
									<div>
										<h3 class="line-clamp-1 font-medium">{item.metadata.title}</h3>
										<span class="line-clamp-1 text-gray-500">{formatDate(item.timestamp)}</span>
									</div>
								</div>

								{#if item.metadata.description}
								<p class="line-clamp-2 mt-4">
									{item.metadata.description}
								</p>
								{/if}

								<p class="mb-1 mt-4"><strong>Original:</strong> <br> <a href="{item.originalUrl}" class="text-blue-500">{item.originalUrl}</a></p>
								<p class="mb-6 break-words"><strong>Expanded:</strong> <br> <a href="{item.expandedUrl}" class="text-blue-500">{item.expandedUrl}</a></p>
								{#if item.metadata.previewUrl}
									<PreviewImage
											url={item.metadata.previewUrl}
											alt={`Preview for ${item.originalUrl}`}
										/>
								{/if}
								<Button class="mt-2" on:click={() => deleteHistoryItem(index)}>Delete</Button>
							</Card.Content>
						</Card.Root>
					{/each}
				</div>
			{/if}
		</div>
	</div>

	<h1 class="">Exp</h1>
</div>
