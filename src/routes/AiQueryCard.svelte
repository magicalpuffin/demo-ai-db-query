<script lang="ts">
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Table from '$lib/components/ui/table';
	import * as Collapsible from '$lib/components/ui/collapsible';
	import * as Card from '$lib/components/ui/card/';
	import Textarea from '$lib/components/ui/textarea/textarea.svelte';
	import ChevronsUpDown from 'lucide-svelte/icons/chevrons-up-down';

	interface Props {
		tableData?: object[];
		aiQuery?: string;
		errorMessage?: string;
	}
	let { tableData = [], aiQuery = '', errorMessage }: Props = $props();
</script>

<Card.Root>
	<Card.Header>
		<Card.Title>AI Query</Card.Title>
		<Card.Description>Write prompts to generate queries</Card.Description>
	</Card.Header>
	<Card.Content>
		{#if errorMessage}
			<div>
				{errorMessage}
			</div>
		{/if}

		<form method="POST">
			<div class="my-4 flex flex-col gap-2 md:flex-row">
				<Textarea name="prompt" placeholder="Enter prompt here" />
				<Button type="submit">Submit</Button>
			</div>
		</form>

		<Collapsible.Root>
			<Collapsible.Trigger class={buttonVariants({ variant: 'outline' })}>
				<h3 class="text-sm font-semibold">Show SQL</h3>
				<ChevronsUpDown />
			</Collapsible.Trigger>
			<Collapsible.Content>
				<form method="POST">
					<div class="my-4 flex flex-col gap-2 md:flex-row">
						<Textarea
							class="bg-gray-100 font-mono"
							name="query"
							placeholder="Enter query here"
							value={aiQuery ?? ''}
						/>
						<Button type="submit">Run Query</Button>
					</div>
				</form>
			</Collapsible.Content>
		</Collapsible.Root>

		{#if tableData[0]}
			<Table.Root>
				<Table.Header>
					<Table.Row>
						{#each Object.keys(tableData[0]) as header}
							<Table.Head>{header}</Table.Head>
						{/each}
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each tableData as dataRow}
						<Table.Row>
							{#each Object.values(dataRow) as dataValue}
								<Table.Cell>{dataValue}</Table.Cell>
							{/each}
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		{/if}
	</Card.Content>
</Card.Root>
