# Demo-AI-DB-Query

This project was created to experiment around with using AI to write SQL queries. User prompts are converted to text embeddings to identify relevant SQL table schemas. Then the identified table schemas and user prompt is passed to the LLM to generate the SQL code.

Created using `SvelteKit` and deployed using `Cloudflare`. UI created with `shadcn-svelte`. The LLM model used for generating SQL queries is `defog/sqlcoder-7b-2`.

![Example Screenshot](/docs/AI%20Query%20Screenshot.png)