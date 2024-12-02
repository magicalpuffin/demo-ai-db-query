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
	import { slide } from 'svelte/transition';
	import { Checkbox } from '$lib/components/ui/checkbox';

	interface Props {
		tableData?: object[];
		aiQuery?: string;
		matchedTables?: string[];
		errorMessage?: string;
		dbParams: string;
	}
	let { tableData = [], aiQuery = '', matchedTables, errorMessage, dbParams }: Props = $props();
	let loading = $state(false);
	let prompt = $state('');
	let updatePrompt = $state('');
	let promptHistory: { timestamp: Date; prompt: string }[] = $state([]);
	let identifyTablesCheckbox = $state(true);
</script>

<Card.Root>
	<Card.Header>
		<Card.Title>AI Query</Card.Title>
		<Card.Description>Write a prompt to generate and execute queries</Card.Description>
	</Card.Header>
	<Card.Content>
		<Collapsible.Root class="my-2">
			<Collapsible.Trigger class={buttonVariants({ variant: 'outline' })}>
				<h3 class="text-sm font-semibold">Show History</h3>
				<ChevronsUpDown />
			</Collapsible.Trigger>
			<Collapsible.Content>
				{#snippet child({ open })}
					{#if open}
						<div class="my-2 rounded-xl border bg-gray-100 p-4" transition:slide>
							{#each promptHistory as promptText}
								<div>
									<span class=" font-semibold">{promptText.timestamp.toLocaleString()}:</span>
									{promptText.prompt}
								</div>
							{/each}
						</div>
					{/if}
				{/snippet}
			</Collapsible.Content>
		</Collapsible.Root>
		{#if errorMessage}
			<div class="text-red-600">
				{errorMessage}
			</div>
		{/if}

		<form
			method="POST"
			action="?/generateQuery"
			use:enhance={() => {
				loading = true;
				promptHistory.push({ timestamp: new Date(), prompt });
				return ({ update }) => {
					update({ invalidateAll: true }).finally(async () => {
						loading = false;
						identifyTablesCheckbox = true;
					});
				};
			}}
		>
			<div class="my-4 flex flex-col gap-2 md:flex-row">
				<input name="dbParams" hidden bind:value={dbParams} />
				<Textarea name="prompt" placeholder="Enter prompt here" bind:value={prompt} />
				<div class="flex flex-col gap-2">
					{#if loading}
						<Button disabled={true}><LoaderCircle class="animate-spin" /></Button>
					{:else}
						<Button type="submit">Submit</Button>
					{/if}
					<div class="w-36">
						<input hidden name="identifyTables" bind:value={identifyTablesCheckbox} />
						<Checkbox bind:checked={identifyTablesCheckbox} /><span>Identify tables</span>
					</div>
				</div>
			</div>
		</form>

		<Collapsible.Root class="my-2">
			<Collapsible.Trigger class={buttonVariants({ variant: 'outline' })}>
				<h3 class="text-sm font-semibold">Show SQL</h3>
				<ChevronsUpDown />
			</Collapsible.Trigger>
			<Collapsible.Content>
				{#snippet child({ open })}
					{#if open}
						<div class="my-4" transition:slide>
							{#if matchedTables && matchedTables.length > 0}
								<div>Tables identified: {JSON.stringify(matchedTables)}</div>
							{/if}
							<form
								method="POST"
								action="?/updateQuery"
								use:enhance={() => {
									loading = true;
									promptHistory.push({ timestamp: new Date(), prompt: updatePrompt });
									return ({ update }) => {
										update({ invalidateAll: true }).finally(async () => {
											loading = false;
										});
									};
								}}
							>
								<div class="flex flex-col gap-2 md:flex-row">
									<input name="dbParams" hidden bind:value={dbParams} />
									<Textarea
										name="prompt_update_query"
										placeholder="Enter prompt to update SQL query"
										bind:value={updatePrompt}
									/>
									<textarea hidden name="query" bind:value={aiQuery}></textarea>
									{#if loading}
										<Button disabled={true}><LoaderCircle class="animate-spin" /></Button>
									{:else}
										<Button type="submit">Update SQL Query</Button>
									{/if}
								</div>
							</form>
							<div class="my-2 overflow-hidden rounded-lg">
								<Highlight
									language={sqlLang}
									code={format(aiQuery ?? '', { language: 'sqlite' })}
								/>
							</div>
						</div>
					{/if}
				{/snippet}
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
