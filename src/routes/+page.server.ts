import { error } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

function cleanQuery(input: string) {
	const query = input.replaceAll('ILIKE', 'LIKE').replaceAll('ilike', 'like');

	if (['SELECT', 'WITH', 'select', 'with'].includes(query.trim().split(' ')[0]))
		return { aiquery: query };

	return { aiquery: query, error: 'Query missing select or with statement' };
}

export const load: PageServerLoad = async ({ platform }) => {
	if (!platform?.env.DB) return error(500, 'Default database missing');

	const tableSchema = (
		await platform.env.DB.prepare(
			"SELECT tbl_name, sql FROM sqlite_master WHERE type='table';"
		).all<{ tbl_name: string; sql: string }>()
	).results;

	return {
		tableSchema
	};
};

export const actions = {
	generateQuery: async ({ request, platform }) => {
		if (!platform?.env.DB) return error(500, 'Default database missing');

		const data = await request.formData();
		const prompt = data.get('prompt') as string | null;
		if (!prompt) return { error: 'Prompt is missing' };

		const dbSchema = (
			await platform.env.DB.prepare("SELECT sql FROM sqlite_master WHERE type='table';").all<{
				sql: string;
			}>()
		).results
			.map((item) => item.sql)
			.join('');

		const messages = [
			{
				role: 'system',
				content:
					"You are a model that writes SQL queries. Return a SQL query which meets the user's request.\n" +
					'Use SQLITE dialect. IMPORTANT: Only return SQL. \n' +
					'Queries written must be valid for the following database schema: \n' +
					dbSchema
			},
			{
				role: 'user',
				content: prompt
			}
		];

		const response = (await platform?.env.AI.run(
			'@cf/defog/sqlcoder-7b-2',
			{
				messages
			},
			{
				gateway: {
					id: 'puffin-ai-gateway'
				}
			}
		)) as AiTextGenerationOutput;

		if (!response || response instanceof ReadableStream || !response.response)
			return { error: 'Unable to generate query' };

		const generatedQuery = cleanQuery(response.response);
		if (generatedQuery.error) return generatedQuery;

		try {
			const resp = (await platform.env.DB.prepare(generatedQuery.aiquery).all())
				.results as object[];
			return { aiquery: generatedQuery.aiquery, data: resp };
		} catch (error) {
			if (error instanceof Error)
				return { aiquery: generatedQuery.aiquery, error: error.cause.message };

			// console.log(error);
			return { aiquery: generatedQuery.aiquery, error: 'Error with query' };
		}
	},
	updateQuery: async ({ request, platform }) => {
		if (!platform?.env.DB) return error(500, 'Default database missing');

		const data = await request.formData();
		const promptUpdate = data.get('prompt_update_query') as string | null;
		const existingQuery = data.get('query') as string | null;
		if (!promptUpdate) return { error: 'Update prompt is missing' };
		if (!existingQuery || existingQuery.length < 1) return { error: 'No query to update ' };

		const dbSchema = (
			await platform.env.DB.prepare("SELECT sql FROM sqlite_master WHERE type='table';").all<{
				sql: string;
			}>()
		).results
			.map((item) => item.sql)
			.join('');

		const messages = [
			{
				role: 'system',
				content:
					"You are a model that fixes SQL queries. Update the existing SQL query to meet the user's request.\n" +
					'Use SQLITE dialect. IMPORTANT: Only return SQL. \n' +
					'Update the following SQL query: \n' +
					existingQuery +
					'\n' +
					'Queries written must be valid for the following database schema: \n' +
					dbSchema
			},
			{
				role: 'user',
				content: promptUpdate
			}
		];

		const response = (await platform?.env.AI.run(
			'@cf/defog/sqlcoder-7b-2',
			{
				messages
			},
			{
				gateway: {
					id: 'puffin-ai-gateway'
				}
			}
		)) as AiTextGenerationOutput;

		if (!response || response instanceof ReadableStream || !response.response)
			return { error: 'Unable to generate query' };

		const generatedQuery = cleanQuery(response.response);
		if (generatedQuery.error) return generatedQuery;

		try {
			const resp = (await platform.env.DB.prepare(generatedQuery.aiquery).all())
				.results as object[];
			return { aiquery: generatedQuery.aiquery, data: resp };
		} catch (error) {
			if (error instanceof Error)
				return { aiquery: generatedQuery.aiquery, error: error.cause.message };
			// console.log(error);
			return { aiquery: generatedQuery.aiquery, error: 'Error with query' };
		}
	}
} satisfies Actions;
