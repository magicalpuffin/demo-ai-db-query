<script lang="ts">
	import * as Card from '$lib/components/ui/card/';

	interface Props {}
	let {}: Props = $props();
</script>

<Card.Root>
	<Card.Header>
		<Card.Title>About</Card.Title>
	</Card.Header>
	<Card.Content>
		This is a basic demo project created to experiment around with using AI to write SQL queries.
		Using shadcn-svelte for UI, using defog/sqlcoder-7b-2 ai model, deployed using Cloudflare pages.
	</Card.Content>
</Card.Root>
