<template>
	<UiCard class="relative">
		<UiCardContent class="w-{{props.size}}">
			<UiFancyIcon v-if="props.icon" class="mb-6" :icon="props.icon" />
			<p v-if="props.subHeader" class="mb-2 text-sm font-medium text-muted-foreground" v-html="props.subHeader" />
			<div class="flex items-end justify-between gap-5">
				<h3 v-if="props.header" class="text-3xl font-bold tracking-tight md:text-4xl" v-html="props.header" />
				<UiBadge v-if="props.badge">{{ $props.badge }}</UiBadge>
			</div>
			<p v-if="props.subText" class="mt-4 text-sm font-medium text-muted-foreground" v-html="props.subText" />
		</UiCardContent>
	</UiCard>
</template>

<script lang="ts" setup>
const props = withDefaults(
	defineProps<{
		icon?: string;
		subHeader?: string;
		header?: string;
		badge?: string;
		subText?: string;
	}>(),
	{
		icon: "lucide:trending-up",
		subHeader: "Revenue",
		header: "$ 1,204",
		badge: "+ 5.4%",
		subText: "Since last month",
	}
);
</script>

<style></style>