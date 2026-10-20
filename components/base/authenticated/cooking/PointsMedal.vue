<template>
	<span
		v-if="rank <= 3 || showRank"
		class="flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
		:class="rankClass"
		:aria-label="`Plaats ${rank}`"
	>
		<Icon v-if="rank <= 3" :name="medalIcon" class="size-4" />
		<template v-else>{{ rank }}</template>
	</span>
</template>

<script setup lang="ts">
const props = withDefaults(
	defineProps<{
		rank: number;
		showRank?: boolean;
	}>(),
	{
		showRank: true,
	}
);

const rankClass = computed(() => {
	switch (props.rank) {
		case 1:
			return "bg-amber-500/15 text-amber-700 dark:text-amber-300";
		case 2:
			return "bg-slate-400/15 text-slate-600 dark:text-slate-300";
		case 3:
			return "bg-orange-500/15 text-orange-700 dark:text-orange-300";
		default:
			return "bg-muted text-muted-foreground";
	}
});

const medalIcon = computed(() => {
	switch (props.rank) {
		case 1:
			return "lucide:crown";
		case 2:
			return "lucide:medal";
		default:
			return "lucide:award";
	}
});
</script>
