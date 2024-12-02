import { error } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

interface EmbeddingResponse {
	shape: number[];
	data: number[][];
}

function cleanQuery(input: string) {
	const query = input.replaceAll('ILIKE', 'LIKE').replaceAll('ilike', 'like');

	if (['SELECT', 'WITH', 'select', 'with'].includes(query.trim().split(' ')[0]))
		return { aiquery: query };

	return { aiquery: query, error: 'Query missing select or with statement' };
}

export const load: PageServerLoad = async ({ platform, url }) => {
	const dbParams = url.searchParams.get('db') ?? 'chinook';
	let db: D1Database | undefined;
	if (dbParams === 'sakila') {
		db = platform?.env.DBSAKILA;
	} else if (dbParams === 'northwind') {
		db = platform?.env.DBNORTHWIND;
	} else {
		db = platform?.env.DBCHINOOK;
	}
	if (!db) return error(500, 'Database is missing');

	const tableSchema = (
		await db
			.prepare("SELECT tbl_name, sql FROM sqlite_master WHERE type='table';")
			.all<{ tbl_name: string; sql: string }>()
	).results;

	if (!platform?.env.VECTORIZE) error(500, 'Vector database is missing');

	// const tableVectors = await Promise.all(
	// 	tableSchema.map(async (t) => {
	// 		return {
	// 			id: dbParams + '-' + t.tbl_name,
	// 			values: (
	// 				(await platform.env.AI.run(
	// 					'@cf/baai/bge-base-en-v1.5',
	// 					{ text: t.sql },
	// 					{
	// 						gateway: {
	// 							id: 'puffin-ai-gateway'
	// 						}
	// 					}
	// 				)) as EmbeddingResponse
	// 			).data[0],
	// 			namespace: dbParams,
	// 			metadata: { table: t.tbl_name }
	// 		};
	// 	})
	// );
	// const insertedvectors = await platform.env.VECTORIZE.insert(tableVectors);
	// console.log(insertedvectors);
	// console.log(tableVectors);

	return {
		dbParams,
		tableSchema
	};
};

export const actions = {
	generateQuery: async ({ request, platform }) => {
		const data = await request.formData();

		const dbParams = (data.get('dbParams') as string | null) ?? 'chinook';
		let db: D1Database | undefined;
		if (dbParams === 'sakila') {
			db = platform?.env.DBSAKILA;
		} else if (dbParams === 'northwind') {
			db = platform?.env.DBNORTHWIND;
		} else {
			db = platform?.env.DBCHINOOK;
		}
		if (!db) return error(500, 'Database is missing');

		const prompt = data.get('prompt') as string | null;
		if (!prompt) return { error: 'Prompt is missing' };

		const identifyTables = data.get('identifyTables') as string | null;

		let dbSchema: string;
		let matchedTables: string[] = [];

		if (identifyTables) {
			if (!platform?.env.VECTORIZE) error(500, 'Vector database is missing');

			const queryEmbedding = (await platform.env.AI.run(
				'@cf/baai/bge-base-en-v1.5',
				{ text: prompt },
				{
					gateway: {
						id: 'puffin-ai-gateway'
					}
				}
			)) as EmbeddingResponse;

			const returnedMatches = await platform.env.VECTORIZE.query(queryEmbedding.data[0], {
				namespace: dbParams,
				returnMetadata: 'indexed'
			});
			matchedTables = returnedMatches.matches.map((m) => m.metadata!.table as string);

			dbSchema = (
				await db
					.prepare(
						`SELECT sql FROM sqlite_master WHERE type='table' AND tbl_name IN (${matchedTables.map((s) => `'${s}'`).join(', ')});`
					)
					.all<{
						sql: string;
					}>()
			).results
				.map((item) => item.sql)
				.join('');
		} else {
			dbSchema = (
				await db.prepare("SELECT sql FROM sqlite_master WHERE type='table'").all<{
					sql: string;
				}>()
			).results
				.map((item) => item.sql)
				.join('');
		}

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
			return { matchedTables, error: 'Unable to generate query' };

		const generatedQuery = cleanQuery(response.response);
		if (generatedQuery.error) return generatedQuery;

		try {
			const resp = (await db.prepare(generatedQuery.aiquery).all()).results as object[];
			return { aiquery: generatedQuery.aiquery, matchedTables, data: resp };
		} catch (error) {
			if (error instanceof Error)
				return { aiquery: generatedQuery.aiquery, matchedTables, error: error.cause.message };

			// console.log(error);
			return { aiquery: generatedQuery.aiquery, matchedTables, error: 'Error with query' };
		}
	},
	updateQuery: async ({ request, platform }) => {
		const data = await request.formData();

		const dbParams = data.get('dbParams') ?? 'chinook';
		let db: D1Database | undefined;
		if (dbParams === 'sakila') {
			db = platform?.env.DBSAKILA;
		} else if (dbParams === 'northwind') {
			db = platform?.env.DBNORTHWIND;
		} else {
			db = platform?.env.DBCHINOOK;
		}
		if (!db) return error(500, 'Database is missing');

		const promptUpdate = data.get('prompt_update_query') as string | null;
		const existingQuery = data.get('query') as string | null;
		if (!promptUpdate) return { error: 'Update prompt is missing' };
		if (!existingQuery || existingQuery.length < 1) return { error: 'No query to update ' };

		const dbSchema = (
			await db.prepare("SELECT sql FROM sqlite_master WHERE type='table';").all<{
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
			const resp = (await db.prepare(generatedQuery.aiquery).all()).results as object[];
			return { aiquery: generatedQuery.aiquery, data: resp };
		} catch (error) {
			if (error instanceof Error)
				return { aiquery: generatedQuery.aiquery, error: error.cause.message };
			// console.log(error);
			return { aiquery: generatedQuery.aiquery, error: 'Error with query' };
		}
	}
} satisfies Actions;
