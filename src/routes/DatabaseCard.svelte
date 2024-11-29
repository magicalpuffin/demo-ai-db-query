<script lang="ts">
	import sqlLang from 'svelte-highlight/languages/sql';
	import Highlight from 'svelte-highlight';
	import { format } from 'sql-formatter';

	import * as Table from '$lib/components/ui/table';
	import * as Card from '$lib/components/ui/card/';

	interface Props {
		tableSchema?: { tbl_name: string; sql: string }[];
	}
	let { tableSchema = [] }: Props = $props();
</script>

<Card.Root>
	<Card.Header>
		<Card.Title>Database</Card.Title>
		<Card.Description>Preview database table schemas</Card.Description>
	</Card.Header>
	<Card.Content>
		{#if tableSchema.length > 0}
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head>tbl_name</Table.Head>
						<Table.Head>sql</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each tableSchema as dataRow}
						<Table.Row>
							<Table.Cell>{dataRow.tbl_name}</Table.Cell>
							<Table.Cell>
								<Highlight
									class="overflow-hidden rounded-lg "
									language={sqlLang}
									code={format(dataRow.sql, { language: 'sqlite' })}
								/>
							</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		{:else}
			<div>No data returned</div>
		{/if}
	</Card.Content>
</Card.Root>
