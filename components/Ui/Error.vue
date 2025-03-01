<template>
	<div class="relative flex h-screen items-center">
		<div
			class="absolute inset-0 -z-10 h-full w-full bg-background bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:6rem_4rem]">
			<div
				class="absolute bottom-0 left-0 right-0 top-0 bg-[radial-gradient(circle_800px_at_100%_200px,#f2845c,transparent)]">
			</div>
		</div>

		<div class="container relative z-[1]">
			<p class="mb-5 font-bold tracking-tight text-primary">{{ statusCode }} error</p>
			<h1 class="text-4xl font-bold tracking-tight lg:text-5xl">{{ title }}</h1>
			<UiButton class="mt-5" @click="clearError({ redirect: '/' })">Terug naar home</UiButton>
		</div>
	</div>
</template>

<script lang="ts" setup>
const props = withDefaults(
	defineProps<{
		statusCode?: number;
		fatal?: boolean;
		unhandled?: boolean;
		statusMessage?: string;
		message?: string;
		data?: unknown;
		cause?: unknown;
	}>(),
	{
		statusCode: 404,
		fatal: false,
		unhandled: false,
		statusMessage: "",
		message: "We kunnen deze pagina niet vinden",
		data: undefined,
		cause: undefined,
	}
);

const title = computed(() => {
	if (!props.statusMessage) return "Error";
	return props.statusMessage;
});

useSeoMeta({ title });
</script>
