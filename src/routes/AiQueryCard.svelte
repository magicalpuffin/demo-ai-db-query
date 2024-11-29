<script lang="ts">
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Table from '$lib/components/ui/table';
	import * as Collapsible from '$lib/components/ui/collapsible';
	import * as Card from '$lib/components/ui/card/';
	import Textarea from '$lib/components/ui/textarea/textarea.svelte';
	import ChevronsUpDown from 'lucide-svelte/icons/chevrons-up-down';
	import LoaderCircle from 'lucide-svelte/icons/loader-circle';
	import { enhance } from '$app/forms';
	import sqlLang from 'svelte-highlight/languages/sql';
	import Highlight from 'svelte-highlight';
	import { format } from 'sql-formatter';

	interface Props {
		tableData?: object[];
		aiQuery?: string;
		errorMessage?: string;
	}
	let { tableData = [], aiQuery = '', errorMessage }: Props = $props();
	let loading = $state(false);
	let prompt = $state('');
	let promptHistory: { timestamp: Date; prompt: string }[] = $state([]);
</script>

<Card.Root>
	<Card.Header>
		<Card.Title>AI Query</Card.Title>
		<Card.Description>Write prompts to generate and run queries against database</Card.Description>
	</Card.Header>
	<Card.Content>
		<Collapsible.Root class="my-2">
			<Collapsible.Trigger class={buttonVariants({ variant: 'outline' })}>
				<h3 class="text-sm font-semibold">Show History</h3>
				<ChevronsUpDown />
			</Collapsible.Trigger>
			<Collapsible.Content>
				<div class="my-2 rounded-xl border bg-gray-100 p-4">
					{#each promptHistory as promptText}
						<div>
							<span class=" font-semibold">{promptText.timestamp.toLocaleString()}:</span>
							{promptText.prompt}
						</div>
					{/each}
				</div>
			</Collapsible.Content>
		</Collapsible.Root>
		{#if errorMessage}
			<div class="text-red-600">
				{errorMessage}
			</div>
		{/if}

		<form
			method="POST"
			use:enhance={() => {
				loading = true;
				promptHistory.push({ timestamp: new Date(), prompt });
				return ({ update }) => {
					update({ invalidateAll: true }).finally(async () => {
						loading = false;
					});
				};
			}}
		>
			<div class="my-4 flex flex-col gap-2 md:flex-row">
				<Textarea name="prompt" placeholder="Enter prompt here" bind:value={prompt} />
				{#if loading}
					<Button disabled={true}><LoaderCircle class="animate-spin" /></Button>
				{:else}
					<Button type="submit">Submit</Button>
				{/if}
			</div>
		</form>

		<Collapsible.Root class="my-2">
			<Collapsible.Trigger class={buttonVariants({ variant: 'outline' })}>
				<h3 class="text-sm font-semibold">Show SQL</h3>
				<ChevronsUpDown />
			</Collapsible.Trigger>
			<Collapsible.Content>
				<Highlight
					class="my-2 overflow-hidden rounded-lg"
					language={sqlLang}
					code={format(aiQuery ?? '', { language: 'sqlite' })}
				/>

				<!-- <form method="POST" use:enhance>
					<div class="my-4 flex flex-col gap-2 md:flex-row">
						<Textarea
							class="bg-gray-100 font-mono"
							name="query"
							placeholder="Enter query here"
							value={aiQuery ?? ''}
						/>
						<Button type="submit">Run Query</Button>
					</div>
				</form> -->
			</Collapsible.Content>
		</Collapsible.Root>
		{#if tableData.length > 0}
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
		{:else}
			<div>No data returned</div>
		{/if}
	</Card.Content>
</Card.Root>
