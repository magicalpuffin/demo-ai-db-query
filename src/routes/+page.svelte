<script lang="ts">
	import * as Tabs from '$lib/components/ui/tabs';
	import type { PageData, ActionData } from './$types';
	import AboutCard from './AboutCard.svelte';
	import AiQueryCard from './AiQueryCard.svelte';
	import DatabaseCard from './DatabaseCard.svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<Tabs.Root value="ai_query">
	<Tabs.List class="grid w-full grid-cols-3">
		<Tabs.Trigger value="ai_query">AI Query</Tabs.Trigger>
		<Tabs.Trigger value="database">Database</Tabs.Trigger>
		<Tabs.Trigger value="about">About</Tabs.Trigger>
	</Tabs.List>
	<Tabs.Content value="ai_query">
		<AiQueryCard tableData={form?.data} aiQuery={form?.aiquery} errorMessage={form?.error}
		></AiQueryCard>
	</Tabs.Content>

	<Tabs.Content value="database">
		<DatabaseCard tableSchema={data.tableSchema}></DatabaseCard>
	</Tabs.Content>
	<Tabs.Content value="about">
		<AboutCard />
	</Tabs.Content>
</Tabs.Root>
