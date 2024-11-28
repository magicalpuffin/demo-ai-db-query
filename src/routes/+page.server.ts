// import { db } from '$lib/server/db';
import { error } from '@sveltejs/kit';
import Database from 'better-sqlite3';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import type { Actions, PageServerLoad } from './$types';


export const load: PageServerLoad = async ({fetch}) => {
  const dbfile = await fetch("/chinook.db")

  if (!dbfile.body) return error(500, "Default database missing")

  const chunks = []
  for await (let chunk of dbfile.body) {
    chunks.push(chunk)
  }
  
  // const client = new Database(Buffer.concat(chunks), {readonly:true})
  const client = new Database(":memory:")
  const db = drizzle(client)
	const tableSchema = db.all(
		sql.raw("SELECT * FROM sqlite_master WHERE type='table';")
	) as object[];

	return {
		tableSchema
	};
};

export const actions = {
	default: async ({ request, platform, fetch }) => {
    const dbfile = await fetch("/chinook.db")
    if (!dbfile.body) return error(500, "Default database missing")
  
    const chunks = []
    for await (let chunk of dbfile.body) {
      chunks.push(chunk)
    }
    
    // const client = new Database(Buffer.concat(chunks), {readonly:true})
    const client = new Database(":memory:")
    const db = drizzle(client)


		const data = await request.formData();
		const prompt = data.get('prompt') as string | null;
		if (!prompt) return { error: 'Prompt is missing' };

    const dbSchema = (db.all(
      sql.raw("SELECT sql FROM sqlite_master WHERE type='table';")
    ) as {sql:string}[]).map(item => item.sql).join("")

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
    // console.log(messages)
		const response = (await platform?.env.AI.run('@cf/defog/sqlcoder-7b-2', {
			messages
		})) as AiTextGenerationOutput;

		if (!response) return { error: 'Unable to generate query' };

		try {
			const resp = db.all(sql.raw(response.response)) as object[];
			return { aiquery: response.response, data: resp };
		} catch (error) {
			console.log(error);
			return { error: 'Error with query' };
		}
	}
} satisfies Actions;
