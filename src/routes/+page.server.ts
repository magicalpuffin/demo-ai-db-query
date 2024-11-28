// import { db } from '$lib/server/db';
import { error } from '@sveltejs/kit';
// import Database from 'better-sqlite3';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ platform }) => {
	if (!platform?.env.DB) return error(500, 'Default database missing');
	// platform.env.DB.exec("")

	const db = drizzle(platform?.env.DB);
	const tableSchema = (await db.all(
		sql.raw("SELECT tbl_name, sql FROM sqlite_master WHERE type='table';")
	)) as object[];

	return {
		tableSchema
	};
};

export const actions = {
	default: async ({ request, platform }) => {
		if (!platform?.env.DB) return error(500, 'Default database missing');

		const db = drizzle(platform?.env.DB);

		const data = await request.formData();
		const prompt = data.get('prompt') as string | null;
		if (!prompt) return { error: 'Prompt is missing' };

		const dbSchema = (
			(await db.all(sql.raw("SELECT sql FROM sqlite_master WHERE type='table';"))) as {
				sql: string;
			}[]
		)
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

		const response = (await platform?.env.AI.run('@cf/defog/sqlcoder-7b-2', {
			messages
		})) as AiTextGenerationOutput;

		if (!response) return { error: 'Unable to generate query' };

		try {
			const resp = (await db.all(sql.raw(response.response))) as object[];
			return { aiquery: response.response, data: resp };
		} catch (error) {
			console.log(error);
			return { aiquery: response.response, error: 'Error with query' };
		}
	}
} satisfies Actions;
