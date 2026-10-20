<template>
	<div class="mx-auto flex w-full max-w-7xl flex-col gap-6">
		<header class="flex flex-col gap-1">
			<p class="text-sm font-medium text-primary">Kookbeheer</p>
			<h1 class="text-3xl font-bold tracking-tight">Punten &amp; kookgroepen</h1>
			<p class="max-w-2xl text-sm text-muted-foreground">
				Volg de kookpunten en beheer bij welke kookgroep iedere huisgenoot hoort.
			</p>
		</header>

		<div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
			<div class="rounded-xl border bg-card p-4 shadow-sm">
				<div class="flex items-center justify-between">
					<p class="text-sm font-medium text-muted-foreground">Huisgenoten</p>
					<Icon name="lucide:users-round" class="size-4 text-primary" />
				</div>
				<p class="mt-3 text-2xl font-semibold">{{ data?.users.length ?? "—" }}</p>
			</div>
			<div class="rounded-xl border bg-card p-4 shadow-sm">
				<div class="flex items-center justify-between">
					<p class="text-sm font-medium text-muted-foreground">Gemiddelde punten</p>
					<Icon name="lucide:chart-no-axes-combined" class="size-4 text-primary" />
				</div>
				<p class="mt-3 text-2xl font-semibold">{{ averagePoints }}</p>
			</div>
			<div class="rounded-xl border bg-card p-4 shadow-sm">
				<div class="flex items-center justify-between">
					<p class="text-sm font-medium text-muted-foreground">Kookgroepen</p>
					<Icon name="lucide:chef-hat" class="size-4 text-primary" />
				</div>
				<p class="mt-3 text-2xl font-semibold">{{ data?.cookingGroups.length ?? "—" }}</p>
			</div>
			<div class="rounded-xl border bg-card p-4 shadow-sm">
				<div class="flex items-center justify-between">
					<p class="text-sm font-medium text-muted-foreground">Zonder kookgroep</p>
					<Icon name="lucide:user-round-x" class="size-4 text-primary" />
				</div>
				<p class="mt-3 text-2xl font-semibold">{{ unassignedCount }}</p>
			</div>
		</div>

		<div class="flex flex-col items-start gap-4 md:flex-row">
		<section class="min-w-0 basis-1/2 overflow-hidden rounded-xl border bg-card shadow-sm">
			<div class="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
				<div>
					<h2 class="font-semibold">Kookpunten</h2>
					<!-- <p class="mt-1 text-sm text-muted-foreground">Pas de puntenstand aan.</p> -->
				</div>
				<span class="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
					{{ data?.users.length ?? 0 }} huisgenoten
				</span>
			</div>
			<div v-if="data" class="divide-y">
				<div class="hidden grid-cols-[minmax(0,1fr)_auto_2.5rem] gap-4 bg-muted/40 px-5 py-2.5 text-xs font-medium uppercase tracking-wide text-muted-foreground sm:grid">
					<span>Huisgenoot</span>
					<span class="text-right">Punten</span>
					<span class="text-right">Actie</span>
				</div>
				<div
					v-for="user in data.users"
					:key="user.id"
					class="grid gap-3 px-5 py-4 transition-colors hover:bg-muted/30 sm:grid-cols-[minmax(0,1fr)_auto_2.5rem] sm:items-center sm:gap-4"
				>
					<div class="flex min-w-0 items-center gap-3">
						<span class="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground">
							{{ user.name.slice(0, 1).toUpperCase() }}
						</span>
						<div class="min-w-0">
							<div class="flex min-w-0 items-center gap-2">
								<p class="truncate font-medium">{{ user.name }}</p>
								<BaseAuthenticatedCookingPointsMedal
									v-if="medalRank(user.id) <= 3"
									:rank="medalRank(user.id)"
									:show-rank="false"
								/>
							</div>
							<p class="text-xs text-muted-foreground">{{ user.cookingGroupName ?? "Geen kookgroep" }}</p>
						</div>
					</div>
					<div class="flex items-center justify-end gap-2">
						<input
							v-model.number="selectedPoints[user.id]"
							type="number"
							min="0"
							step="1"
							:aria-label="`Kookpunten voor ${user.name}`"
							class="h-10 w-20 rounded-lg border border-input bg-background px-3 text-sm shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
						/>
						<!-- <span class="text-xs text-muted-foreground">punten</span> -->
					</div>
					<div class="flex justify-end">
						<UiButton
							size="sm"
							variant="outline"
							:disabled="pointsUnchanged(user.id) || savingPointsUserId === user.id"
							@click="saveCookingPoints(user.id)"
						>
							<Icon name="lucide:save" class="size-4" />
						</UiButton>
					</div>
				</div>
				<p v-if="!data.users.length" class="px-5 py-10 text-center text-sm text-muted-foreground">
					Er zijn nog geen gebruikers om te tonen.
				</p>
			</div>
			<div v-else class="px-5 py-10 text-center text-sm text-muted-foreground">
				Gebruikers laden...
			</div>
		</section>

		<section class="min-w-0 basis-1/2 overflow-hidden rounded-xl border bg-card shadow-sm">
			<div class="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
				<div>
					<h2 class="font-semibold">Kookgroepen</h2>
					<!-- <p class="mt-1 text-sm text-muted-foreground">Wijs huisgenoten toe aan een kookgroep of haal ze uit een groep.</p> -->
				</div>
				<span class="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
					{{ data?.cookingGroups.length ?? 0 }} groepen
				</span>
			</div>
			<div v-if="data" class="divide-y">
				<div class="hidden grid-cols-[minmax(0,1fr)_auto_2.5rem] gap-4 bg-muted/40 px-5 py-2.5 text-xs font-medium uppercase tracking-wide text-muted-foreground sm:grid">
					<span>Huisgenoot</span>
					<span class="text-right">Kookgroep</span>
					<span class="text-right">Actie</span>
				</div>
				<div
					v-for="user in data.users"
					:key="user.id"
					class="grid gap-3 px-5 py-4 transition-colors hover:bg-muted/30 sm:grid-cols-[minmax(0,1fr)_auto_2.5rem] sm:items-center sm:gap-4"
				>
					<div class="flex min-w-0 items-center gap-3">
						<span class="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground">
							{{ user.name.slice(0, 1).toUpperCase() }}
						</span>
						<div class="min-w-0">
							<p class="truncate font-medium">{{ user.name }}</p>
							<p class="text-xs text-muted-foreground">{{ user.cookingGroupName ?? "Nog niet ingedeeld" }}</p>
						</div>
					</div>
					<div class="flex justify-end">
						<UiSelect v-model="selectedGroupIds[user.id]">
							<UiSelectTrigger class="h-10 w-40 rounded-lg" placeholder="Kies een kookgroep" />
							<UiSelectContent>
								<UiSelectItem value="none" text="Geen kookgroep" />
								<UiSelectItem
									v-for="group in data.cookingGroups"
									:key="group.id"
									:value="String(group.id)"
									:text="group.name"
								/>
							</UiSelectContent>
						</UiSelect>
					</div>
					<div class="flex justify-end">
						<UiButton
							size="sm"
							:disabled="groupUnchanged(user.id) || savingGroupUserId === user.id"
							@click="saveCookingGroup(user.id)"
						>
							<Icon name="lucide:save" class="size-4" />
						</UiButton>
					</div>
				</div>
				<p v-if="!data.users.length" class="px-5 py-10 text-center text-sm text-muted-foreground">
					Er zijn nog geen gebruikers om in te delen.
				</p>
			</div>
			<div v-else class="px-5 py-10 text-center text-sm text-muted-foreground">
				Gebruikers laden...
			</div>
		</section>
		</div>
	</div>
</template>

<script setup lang="ts">
import type { CookingPointsOverviewDto } from "~/types/dto";

usePageInfoStore().setPageInfo({
	title: "Kookpunten beheren",
});

useSeoMeta({
	title: "Kookpunten beheren",
});

const { data, error, refresh } = await useAPI<CookingPointsOverviewDto>("/api/cooking/points");
const selectedGroupIds = reactive<Record<number, string>>({});
const selectedPoints = reactive<Record<number, number>>({});
const savingGroupUserId = ref<number | null>(null);
const savingPointsUserId = ref<number | null>(null);
const pointRanks = computed(() =>
	[...(data.value?.users ?? [])]
		.sort((a, b) => b.cookingpoints - a.cookingpoints || a.name.localeCompare(b.name))
		.map((user) => user.id)
);
const medalRank = (userId: number) => pointRanks.value.indexOf(userId) + 1;
const averagePoints = computed(() => {
	const users = data.value?.users ?? [];
	if (!users.length) return 0;
	return Math.round(users.reduce((total, user) => total + user.cookingpoints, 0) / users.length);
});
const unassignedCount = computed(
	() => data.value?.users.filter((user) => user.cookingGroupId === null).length ?? 0
);

watch(
	data,
	(overview) => {
		if (!overview) return;
		overview.users.forEach((user) => {
			selectedGroupIds[user.id] = user.cookingGroupId === null ? "none" : String(user.cookingGroupId);
			selectedPoints[user.id] = user.cookingpoints;
		});
	},
	{ immediate: true }
);

if (error.value) {
	useSonner.error(error.value.statusMessage ?? "Kon de kookpunten niet ophalen.");
}

const groupUnchanged = (userId: number) => {
	const user = data.value?.users.find((entry) => entry.id === userId);
	if (!user) return true;
	return selectedGroupIds[userId] === (user.cookingGroupId === null ? "none" : String(user.cookingGroupId));
};

const pointsUnchanged = (userId: number) =>
	data.value?.users.find((entry) => entry.id === userId)?.cookingpoints === selectedPoints[userId];

const saveCookingGroup = async (userId: number) => {
	const selectedGroupId = selectedGroupIds[userId];
	if (selectedGroupId === undefined) return;

	savingGroupUserId.value = userId;
	try {
		const { error } = await useAPI("/api/cooking/group/assign", {
			method: "POST",
			body: {
				userId,
				cookingGroupId: selectedGroupId === "none" ? null : Number(selectedGroupId),
			},
		});
		if (error.value) {
			useSonner.error(error.value.statusMessage ?? "Kon de kookgroep niet bijwerken.");
			return;
		}
		await refresh();
		useSonner.success("Kookgroep bijgewerkt.");
	} catch (cause) {
		const error = cause as { data?: { statusMessage?: string }; statusMessage?: string };
		useSonner.error(error.data?.statusMessage ?? error.statusMessage ?? "Kon de kookgroep niet bijwerken.");
	} finally {
		savingGroupUserId.value = null;
	}
};

const saveCookingPoints = async (userId: number) => {
	const cookingpoints = selectedPoints[userId];
	if (!Number.isInteger(cookingpoints) || cookingpoints < 0) {
		useSonner.error("Kookpunten moeten een positief heel getal zijn.");
		return;
	}

	savingPointsUserId.value = userId;
	try {
		const { error } = await useAPI("/api/cooking/points/update", {
			method: "POST",
			body: { userId, cookingpoints },
		});
		if (error.value) {
			useSonner.error(error.value.statusMessage ?? "Kon de kookpunten niet bijwerken.");
			return;
		}
		await refresh();
		useSonner.success("Kookpunten bijgewerkt.");
	} catch (cause) {
		const error = cause as { data?: { statusMessage?: string }; statusMessage?: string };
		useSonner.error(error.data?.statusMessage ?? error.statusMessage ?? "Kon de kookpunten niet bijwerken.");
	} finally {
		savingPointsUserId.value = null;
	}
};
</script>
