<template>
	<div class="mx-auto flex w-full max-w-7xl flex-col gap-4">
		<header class="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card px-5 py-4 shadow-sm">
			<div>
				<h1 class="text-xl font-semibold tracking-tight">Het grote kook-overzicht</h1>
				<p class="mt-1 text-sm text-muted-foreground">Kookpunten &amp; groepen</p>
			</div>
			<div class="flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-2">
				<Icon name="lucide:trophy" class="size-4 text-amber-600" />
				<span class="text-sm text-muted-foreground">Totaal</span>
				<span class="font-semibold tabular-nums">{{ totalPoints }}</span>
				<span class="text-xs text-muted-foreground">punten</span>
			</div>
		</header>

		<div class="grid items-start gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)]">
			<section class="overflow-hidden rounded-xl border bg-card shadow-sm">
				<div class="flex items-center justify-between border-b px-4 py-3">
					<div class="flex items-center gap-2">
						<Icon name="lucide:chart-no-axes-column-increasing" class="size-4 text-primary" />
						<h2 class="font-semibold">Kookpunten</h2>
					</div>
					<span class="text-xs text-muted-foreground">{{ standings.length }} huisgenoten</span>
				</div>

				<div v-if="data?.users.length" class="max-h-[34rem] divide-y overflow-y-auto">
					<div
						v-for="place in standings"
						:key="place.user.id"
						class="grid grid-cols-[2.25rem_minmax(0,1fr)_auto] items-center gap-3 px-4 py-2.5 transition-colors hover:bg-muted/30"
						:class="{ 'bg-primary/5': place.user.name === sessionStore.sessionData?.name }"
					>
						<BaseAuthenticatedCookingPointsMedal :rank="place.rank" />
						<div class="min-w-0">
							<p class="truncate text-sm font-medium">{{ place.user.name }}</p>
							<p class="truncate text-xs text-muted-foreground">{{ place.user.cookingGroupName ?? "Geen kookgroep" }}</p>
						</div>
						<span class="rounded-full bg-muted px-3 py-1 text-sm font-semibold tabular-nums">
							{{ place.user.cookingpoints }}
						</span>
					</div>
				</div>
				<div v-else-if="data" class="px-4 py-8 text-center text-sm text-muted-foreground">
					Er zijn nog geen kookpunten om te tonen.
				</div>
				<div v-else class="px-4 py-8 text-center text-sm text-muted-foreground">
					Klassement laden...
				</div>
			</section>

			<BaseAuthenticatedHomeUserOverview />
		</div>
	</div>
</template>

<script setup lang="ts">
import type { CookingPointsOverviewDto } from "~/types/dto";

const sessionStore = useSessionStore();
usePageInfoStore().setPageInfo({
	title: "Simpel overzicht",
});
useSeoMeta({
	title: "Simpel overzicht",
});

const { data, error } = await useAPI<CookingPointsOverviewDto>("/api/cooking/points");

if (error.value) {
	useSonner.error(error.value.statusMessage ?? "Kon het overzicht niet ophalen.");
}

const standings = computed(() =>
	[...(data.value?.users ?? [])]
		.sort((a, b) => b.cookingpoints - a.cookingpoints || a.name.localeCompare(b.name))
		.map((user, index) => ({ user, rank: index + 1 }))
);
const totalPoints = computed(() =>
	(data.value?.users ?? []).reduce((total, user) => total + user.cookingpoints, 0)
);

</script>
