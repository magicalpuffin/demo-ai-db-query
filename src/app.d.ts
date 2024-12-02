// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		interface Platform {
			env: {
				AI: Ai;
				VECTORIZE: Vectorize;
				DBCHINOOK: D1Database;
				DBSAKILA: D1Database;
				DBNORTHWIND: D1Database;
			};
			cf: CfProperties;
			ctx: ExecutionContext;
		}
	}
}

export {};
