<script lang="ts">
	import '../app.css';
	let { children } = $props();
</script>

<div class="container mx-auto my-4 max-w-3xl">
	{@render children()}
</div>
