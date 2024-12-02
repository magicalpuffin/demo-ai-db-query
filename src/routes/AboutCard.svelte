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
		<article class="prose max-w-fit">
			<p>
				This project was created to experiment around with using AI to write SQL queries. User
				prompts are converted to text embeddings to identify relevant SQL table schemas. Then the
				identified table schemas and user prompt is passed to the LLM to generate the SQL code.
			</p>
			<p>
				Created using <code>SvelteKit</code> and deployed using <code>Cloudflare</code>. UI created
				with
				<code>shadcn-svelte</code>. The LLM model used for generating SQL queries is
				<code>defog/sqlcoder-7b-2</code>.
			</p>
			<p>Using Chinook, Sakila, and Northwind Traders SQLite data sets.</p>
			<p>
				Source code at: <a href="https://github.com/magicalpuffin/demo-ai-db-query"
					>https://github.com/magicalpuffin/demo-ai-db-query</a
				>
			</p>
		</article>
	</Card.Content>
</Card.Root>
