// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		interface Platform {
			env: {
				AI: Ai;
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
