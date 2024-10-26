<script lang="ts">
	export let url: string;
	export let alt: string = 'Preview';

	const isSafeUrl = (url: string): boolean => {
		try {
			const parsed = new URL(url);
			return parsed.protocol === 'http:' || parsed.protocol === 'https:';
		} catch {
			return false;
		}
	};
</script>

{#if url && isSafeUrl(url)}
	<img
		src={url}
		{alt}
		class="max-w-full h-auto rounded-lg shadow-md"
		on:error={(e) => {
			const target = e.target as HTMLImageElement | null;
			if (target) {
				// Handle error loading image
				target.style.display = 'none';
			}
		}}
	/>
{/if}
