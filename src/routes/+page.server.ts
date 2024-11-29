import { error } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

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
	default: async ({ request, platform }) => {
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
					id: 'puffin-ai-gateway',
					skipCache: false,
					cacheTtl: 3360
				}
			}
		)) as AiTextGenerationOutput;

		if (!response) return { error: 'Unable to generate query' };

		try {
			const resp = (await platform.env.DB.prepare(response.response).all()).results as object[];
			return { aiquery: response.response, data: resp };
		} catch (error) {
			console.log(error);
			return { aiquery: response.response, error: 'Error with query' };
		}
	}
} satisfies Actions;
