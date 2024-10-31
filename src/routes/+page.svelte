<script lang="ts">
	import { onMount } from 'svelte';
	import type { TLinkState } from '../types';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import Label from '$lib/components/ui/label/label.svelte';
	import PreviewImage from '$lib/components/PreviewImage.svelte';
	import * as Card from '$lib/components/ui/card';
	import { ImageOff } from 'lucide-svelte';
	import * as Alert from '$lib/components/ui/alert';
	import Skeleton from '$lib/components/ui/skeleton/skeleton.svelte';
	import { writable } from 'svelte/store';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Bomb } from 'lucide-svelte';
	import { formatDate } from '$lib/utils';
	import { toast } from 'svelte-sonner';

	const linkState = $state<TLinkState>({
		originalUrl: '',
		expandedUrl: '',
		metadata: null,
		loading: false,
		error: null,
		history: []
	});

	const isLoading = writable(true);

	async function expandUrl() {
		try {
			linkState.loading = true;
			linkState.error = null;

			if (!isValidUrl(linkState.originalUrl)) {
				toast.error('Invalid URL format', {
					description: 'Please enter a valid URL (e.g., https://example.com)'
				});

				linkState.loading = false;
				return;
			}

			const response = await fetch('/api/expand', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ url: linkState.originalUrl })
			});

			const data = await response.json();

			if (!data.success) {
				toast.error('Error expanding URL', {
					description: 'An error occurred while expanding the URL. Please try again later.'
				});

				linkState.loading = false;
				return;
			}

			toast.success('URL expanded successfully', {
				description: 'The URL has been successfully expanded and added to the history.'
			});

			linkState.expandedUrl = data.expandedUrl;
			linkState.metadata = data.metadata;

			const newHistoryEntry = {
				originalUrl: linkState.originalUrl,
				expandedUrl: data.expandedUrl,
				metadata: data.metadata,
				security: data.security,
				timestamp: new Date()
			};

			linkState.history = [newHistoryEntry, ...linkState.history].slice(0, 10);
			localStorage.setItem('linkHistory', JSON.stringify(linkState.history));
		} catch (error) {
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
			const url = new URL(string);
			return url.protocol === 'http:' || url.protocol === 'https:';
		} catch {
			return false;
		}
	}

	function deleteHistoryItem(index: number) {
		linkState.history = linkState.history.filter((_, i) => i !== index);
		localStorage.setItem('linkHistory', JSON.stringify(linkState.history));
	}

	function handleImgError(event: Event): void {
		const target = event.target as HTMLImageElement;
		target.onerror = null; 
		target.src = 'https://hgk28y.csb.app/empty-product-image.svg'; 
	}

	onMount(() => {
		isLoading.set(true);

		try {
			const savedHistory = localStorage.getItem('linkHistory');
			if (savedHistory) {
				linkState.history = JSON.parse(savedHistory);
			}
		} catch {
			toast.error('Error loading history', {
				description: 'An error occurred while loading the history. Please try again later.'
			});
		} finally {
			isLoading.set(false);
		}
	});
</script>

<svelte:head>
	<title>Link Explosion • Detonate URLs and get information about them</title>
</svelte:head>

<div
	class="min-h-screen bg-[#fcfcfd] flex flex-col justify-between items-center relative overflow-hidden sm:py-12"
>
	<div class="max-w-2xl mx-auto py-20 w-full">
		<div
			class="relative px-7 py-6 bg-white ring-1 ring-gray-900/5 rounded-lg leading-none flex flex-col items-top justify-start space-x-6"
		>
			<h2 class="text-2xl font-bold text-center text-gray-800 md:text-3xl">
				Ready to Bomb Some Links?
			</h2>

			<p class="mt-2 text-center text-gray-500 md:mt-4 mb-6">
				Drop a URL and watch it explode with information.
			</p>

			<div class="space-y-2">
				<Label for="email">URL</Label>
				<Input
					bind:value={linkState.originalUrl}
					placeholder="Paste the URL you want to detonate..."
				/>

				<Button class="w-full" onclick={expandUrl} disabled={linkState.loading}>
					{linkState.loading ? 'Explosion in progress...' : 'Detonating URL'}
				</Button>
			</div>
		</div>

		<div class="container px-4 py-20 mx-auto">
			<div class="flex flex-col items-center text-center mb-5">
				<h2 class="text-3xl font-bold">History</h2>
				<p class="mt-4 text-gray-500">You can see the last 10 URLs you've expanded here.</p>
			</div>

			{#if !linkState.history.length && !$isLoading}
				<div>
					<Alert.Root>
						<Bomb size="20" />
						<Alert.Title>No History Available</Alert.Title>
						<Alert.Description>
							You haven't expanded any URLs yet. Paste a URL above to get started!
						</Alert.Description>
					</Alert.Root>
				</div>
			{/if}

			{#if $isLoading}
				<div class="space-y-4">
					<Card.Root>
						<Card.Content>
							<div class="flex items-center space-x-4">
								<Skeleton class="h-12 w-12 rounded-full" />
								<div class="space-y-2">
									<Skeleton class="h-4 w-[250px]" />
									<Skeleton class="h-4 w-[200px]" />
								</div>
							</div>

							<Skeleton class="aspect-square w-full mt-4" />
						</Card.Content>
					</Card.Root>
				</div>
			{/if}

			{#if linkState.history.length > 0}
				<div class="space-y-4">
					{#each linkState.history as item, index}
						<Card.Root class="bg-white">
							<Card.Content>
								<Alert.Root class="mb-4">
									<Alert.Title class={item.security.isSafe ? 'text-green-500' : 'text-rose-500'}>
										{item.security.isSafe ? 'Safe URL' : 'Suspicious URL'}
									</Alert.Title>
									<Alert.Description>
										{item.security.isSafe
											? 'This URL is safe to visit.'
											: `This URL is suspicious! Risks: ${item.security.risks.join(', ')}`}
									</Alert.Description>
								</Alert.Root>

								<div class="flex flex-row items-start gap-x-4">
									{#if item.metadata?.faviconUrl}
										<img
											src={item.metadata?.faviconUrl}
											alt="Favicon"
											class="size-14 rounded-full border border-gray-200 p-2"
											onerror={handleImgError}
										/>
									{:else}
										<div
											class="size-14 rounded-full border border-gray-200 p-2 flex items-center justify-center"
										>
											<ImageOff />
										</div>
									{/if}

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

								<p class="mb-1 mt-4">
									<strong>Original:</strong> <br />
									<a href={item.originalUrl} class="text-blue-500">{item.originalUrl}</a>
								</p>
								<p class="mb-6 break-words">
									<strong>Expanded:</strong> <br />
									<a href={item.expandedUrl} class="text-blue-500">{item.expandedUrl}</a>
								</p>
								{#if item.metadata.previewUrl}
									<PreviewImage
										url={item.metadata.previewUrl}
										alt={`Preview for ${item.originalUrl}`}
									/>
								{/if}

								<div class="flex flex-row justify-end gap-x-2">
									<Dialog.Root>
										<Dialog.Trigger>
											<Button class="mt-2">Visit Url</Button>
										</Dialog.Trigger>
										<Dialog.Content>
											<Dialog.Header>
												<Dialog.Title>Are you sure you want visit this URL?</Dialog.Title>
												<Dialog.Description>
													You are about to visit the URL: <br />

													<p class="bg-white border font-mono p-3 rounded-md text-sm break-all">
														{item.expandedUrl}
													</p>
												</Dialog.Description>

												<Dialog.Footer>
													<Button class="mt-2">Cancel</Button>
													<Button
														class="mt-2"
														on:click={() => window.open(item.expandedUrl, '_blank')}>Visit</Button
													>
												</Dialog.Footer>
											</Dialog.Header>
										</Dialog.Content>
									</Dialog.Root>

									<Button class="mt-2" on:click={() => deleteHistoryItem(index)}>Delete</Button>
								</div>
							</Card.Content>
						</Card.Root>
					{/each}
				</div>
			{/if}
		</div>
	</div>

	<footer class="w-full py-4 text-center text-gray-600">
		<div class="flex items-center justify-center gap-2 mb-2">
			<Bomb size="20" />
			<span class="font-medium"> Link Explosion </span>
		</div>
		<p class="text-sm">Blast That URL!</p>
		<div class="mt-2 text-xs text-gray-500">
			© 2024 • Created by <a
				href="https://github.com/az-ka"
				class="hover:text-blue-500 transition-colors">Azka</a
			>
		</div>
	</footer>
</div>
