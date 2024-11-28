// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
        interface Platform {
            env: {
                AI:Ai
                DB:D1Database
            }
            cf: CfProperties
            ctx: ExecutionContext
        }
    }
}

export { }

