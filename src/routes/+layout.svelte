<script lang="ts">
	import '../app.css';
	let { children } = $props();
</script>

<div class="container my-4 max-w-3xl px-2">
	{@render children()}
</div>
