<script lang="ts">
	import sqlLang from 'svelte-highlight/languages/sql';
	import Highlight from 'svelte-highlight';
	import { format } from 'sql-formatter';

	import * as Table from '$lib/components/ui/table';
	import * as Card from '$lib/components/ui/card/';

	interface Props {
		tableSchema?: object[];
	}
	let { tableSchema = [] }: Props = $props();
</script>

<Card.Root>
	<Card.Header>
		<Card.Title>Database</Card.Title>
		<Card.Description>Preview database tables</Card.Description>
	</Card.Header>
	<Card.Content>
		{#if tableSchema[0]}
			<Table.Root>
				<Table.Header>
					<Table.Row>
						{#each Object.keys(tableSchema[0]) as header}
							<Table.Head>{header}</Table.Head>
						{/each}
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each tableSchema as dataRow}
						<Table.Row>
							{#each Object.entries(dataRow) as dataValue}
								{#if dataValue[0] === 'sql'}
									<Table.Cell>
										<Highlight
											class="overflow-hidden rounded-lg "
											language={sqlLang}
											code={format(dataValue[1], { language: 'sqlite' })}
										/>
									</Table.Cell>
								{:else}
									<Table.Cell>{dataValue[1]}</Table.Cell>
								{/if}
							{/each}
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		{/if}
	</Card.Content>
</Card.Root>
