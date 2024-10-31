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
		class="w-full rounded-lg mb-3"
		on:error={(e) => {
			const target = e.target as HTMLImageElement | null;
			if (target) {
				target.style.display = 'none';
			}
		}}
	/>
{/if}
