<script lang="ts">
	import { onMount } from 'svelte';
	import type { TLinkHistory, TLinkState } from '../types';

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

			// Gunakan endpoint proxy kita
			const response = await fetch('/api/expand', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ url: linkState.originalUrl })
			});

			const data = await response.json();

			if (!data.success) {
				throw new Error(data.error || 'Terjadi kesalahan saat mengekspand URL');
			}

			linkState.expandedUrl = data.expandedUrl;
			linkState.metadata = data.metadata;

			// Update history
			const newHistoryEntry: TLinkHistory = {
				originalUrl: linkState.originalUrl,
				expandedUrl: data.expandedUrl,
				metadata: data.metadata,
				timestamp: new Date()
			};

			linkState.history = [newHistoryEntry, ...linkState.history].slice(0, 10);
			localStorage.setItem('linkHistory', JSON.stringify(linkState.history));
		} catch (error) {
			console.error(error);
			linkState.error = {
				message: error instanceof Error ? error.message : 'Terjadi kesalahan yang tidak diketahui',
				status: 500
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

<main class="container mx-auto p-4 max-w-3xl">
	<h1 class="text-3xl font-bold mb-8 text-center">URL Expander</h1>

	<!-- Form Input -->
	<div class="bg-white p-6 rounded-lg shadow-md mb-8">
		<div class="flex gap-4">
			<input
				type="url"
				bind:value={linkState.originalUrl}
				placeholder="Masukkan short URL di sini..."
				class="flex-1 p-2 border rounded"
			/>
			<button
				onclick={expandUrl}
				disabled={linkState.loading}
				class="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
			>
				{linkState.loading ? 'Memproses...' : 'Expand URL'}
			</button>
		</div>

		{#if linkState.error}
			<div class="mt-4 p-4 bg-red-100 text-red-700 rounded">
				{linkState.error}
			</div>
		{/if}

		{#if linkState.expandedUrl}
			<div class="mt-6">
				<h2 class="text-xl font-semibold mb-2">Hasil:</h2>
				<div class="bg-gray-50 p-4 rounded">
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
						</div>
					{/if}
				</div>
			</div>
		{/if}
	</div>

	<!-- History Section -->
	{#if linkState.history.length > 0}
		<div class="bg-white p-6 rounded-lg shadow-md">
			<h2 class="text-xl font-semibold mb-4">Riwayat URL</h2>
			<div class="space-y-4">
				{#each linkState.history as item}
					<div class="border-b pb-4">
						<p class="text-sm text-gray-600">
							{new Date(item.timestamp).toLocaleString()}
						</p>
						<p class="mb-1"><strong>Original:</strong> {item.originalUrl}</p>
						<p><strong>Expanded:</strong> {item.expandedUrl}</p>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</main>
