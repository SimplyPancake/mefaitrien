<template>
	<main class="relative flex min-h-screen items-center">
		<div
			class="absolute inset-0 -z-10 bg-background bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:6rem_6rem]"
		>
			<div class="absolute inset-0 bg-[radial-gradient(circle_800px_at_100%_200px,#f2845c,transparent)]" />
		</div>
		<div class="container relative z-[1]">
			<p class="mb-5 font-bold tracking-tight text-primary">{{ statusCode }} error</p>
			<h1 class="text-4xl font-bold tracking-tight lg:text-5xl">{{ title }}</h1>
			<p v-if="message" class="mt-3 text-muted-foreground">{{ message }}</p>
			<button
				class="mt-5 rounded-md bg-primary px-4 py-2 text-primary-foreground"
				type="button"
				@click="clearError({ redirect: '/' })"
			>
				Terug naar home
			</button>
		</div>
	</main>
</template>

<script setup lang="ts">
const error = useError();

const statusCode = computed(() =>
	typeof error.value?.statusCode === 'number' ? error.value.statusCode : 404
);
const statusMessage = computed(() =>
	typeof error.value?.statusMessage === 'string' ? error.value.statusMessage : ''
);
const message = computed(() =>
	typeof error.value?.message === 'string' ? error.value.message : 'We kunnen deze pagina niet vinden'
);
const title = computed(() => statusMessage.value || 'Error');

</script>