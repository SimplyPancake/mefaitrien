<template>
	<div class="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
		<UiCard class="w-full min-w-0 xl:col-span-2" title="Vandaag">
			<template #content>
				<UiList class="w-full min-w-0">
					<UiListItem v-for="assignment in dashboard?.todayAssignments ?? []" :key="assignment.id" class="min-w-0 px-3 sm:px-6">
						<Icon name="lucide:chef-hat" class="size-8 shrink-0 text-primary sm:size-10" />
						<UiListContent>
							<UiListTitle class="break-words" :title="`${assignment.user.name} kookt voor ${assignment.cookingGroup.name}`" />
						</UiListContent>
					</UiListItem>
					<UiListItem v-if="dashboard && !dashboard.todayAssignments.length" class="min-w-0 px-3 sm:px-6">
						<Icon name="lucide:chef-hat" class="size-8 shrink-0 text-muted-foreground sm:size-10" />
						<UiListContent>
							<UiListTitle title="Er zijn vandaag geen koks ingedeeld" />
						</UiListContent>
					</UiListItem>
					<!-- <UiListItem class="min-w-0 px-3 sm:px-6">
						<Icon name="lucide:toilet" class="size-8 shrink-0 text-primary sm:size-10" />
						<UiListContent>
							<UiListTitle title="De WC's worden schoongemaakt" />
							<UiListSubtitle class="line-clamp-2" subtitle="Vandaag maken Berg en Justin schoon" />
						</UiListContent>
					</UiListItem> -->
				</UiList>
			</template>
		</UiCard>
		<UiCard class="w-full min-w-0 xl:col-span-2" title="Statistieken">
			<template #content>
				<UiList class="w-full min-w-0">
					<UiListItem class="min-w-0 px-3 sm:px-6">
						<Icon name="lucide:trending-up" class="size-8 shrink-0 text-primary sm:size-10" />
						<UiListContent>
							<UiListTitle :title="`Je hebt ${formatQuantifier(dashboard?.cookingPoints, 'kookpunt', 'kookpunten', 'geen')}`" />
						</UiListContent>
					</UiListItem>
					<UiListItem class="min-w-0 px-3 sm:px-6">
						<Icon name="lucide:bubbles" class="size-8 shrink-0 text-primary sm:size-10" />
						<UiListContent>
							<UiListTitle :title="`Je hebt ${formatQuantifier(dashboard?.washingPoints, 'afwaspunt', 'afwaspunten', 'geen')}`" />
						</UiListContent>
					</UiListItem>
					<!-- Schoonmaak -->
					<UiListItem class="min-w-0 px-3 sm:px-6">
						<Icon name="lucide:cooking-pot" class="size-8 shrink-0 text-primary" />
						<UiListContent>
							<UiListTitle title="Jouw kookdagen deze week" />
							<UiListSubtitle
								class="line-clamp-2"
								:subtitle="weeklyCookingDaysText"
							/>
						</UiListContent>
					</UiListItem>
					<!-- <UiListItem class="min-w-0 px-3 sm:px-6">
						<Icon name="lucide:brush-cleaning" class="size-8 shrink-0 text-primary sm:size-10" />
						<UiListContent>
							<UiListTitle title="Volgende keer dat je schoon moet maken" />
							<UiListSubtitle class="line-clamp-2"
								subtitle="Jij moet als volgende de woonkamer schoonmaken met als extra taak de kastjes" />
						</UiListContent>
					</UiListItem> -->
				</UiList>
			</template>
		</UiCard>
		<BaseAuthenticatedHomeUserOverview class="w-full min-w-0 md:col-span-2 xl:col-span-1" />
		<!-- <div class="min-w-0 md:col-span-2 xl:col-span-3">
			<UiCard class="w-full min-w-0" title="Schema van deze week (K1)" :description="weekRange">
				<template #content>
					<UiCardContent class="min-w-0 !px-3 sm:!px-6">
						<div class="max-w-full overflow-x-auto">
						<UiTimeline :model-value="3" orientation="horizontal" class="min-w-[42rem] sm:min-w-0">
							<UiTimelineItem v-for="item in timelineItems" :key="item.id" :step="item.id">
								<UiTimelineHeader>
									<UiTimelineSeparator />
									<UiTimelineDate>{{ item.date }}</UiTimelineDate>
									<UiTimelineTitle>{{ item.title }}</UiTimelineTitle>
									<UiTimelineIndicator />
								</UiTimelineHeader>
								<UiTimelineContent>{{ item.description }}</UiTimelineContent>
							</UiTimelineItem>
						</UiTimeline>
						</div>
					</UiCardContent>
				</template>
			</UiCard>
		</div> -->
	</div>

	<!-- Weekly Schedule Timeline Overview -->



</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { HomeDashboardDto } from "~/types/dto";

usePageInfoStore().setPageInfo({
	title: 'Dashboard',
});

const { data: dashboard, error } = await useAPI<HomeDashboardDto>("/api/cooking/dashboard");
if (error.value) {
	useSonner.error(error.value.statusMessage ?? "Kon je kookgegevens niet ophalen.");
}

const weeklyCookingDaysText = computed(() => {
	const days = dashboard.value?.cookingDaysThisWeek ?? [];
	if (!days.length) return "Je hoeft deze week niet te koken.";
	return `Jij kookt op ${days.map((day) =>
		new Date(`${day}T12:00:00`).toLocaleDateString("nl-NL", { weekday: "long" })
	).join(" en ")}.`;
});

const weekRange = computed(() => {
	const today = new Date();
	const dayOfWeek = today.getDay();
	// Calculate Monday of this week
	const monday = new Date(today);
	monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));
	// Calculate Friday of this week
	const friday = new Date(monday);
	friday.setDate(monday.getDate() + 4);
	return `${monday.getDate()} ${monday.toLocaleString('nl-NL', { month: 'long' })} - ${friday.getDate()} ${friday.toLocaleString('nl-NL', { month: 'long' })}`;
});

const timelineItems = [
	{ id: 1, date: 'Maandag', title: 'Justin kookt', description: '' },
	{ id: 2, date: 'Dinsdag', title: 'Sarah kookt', description: '' },
	{ id: 3, date: 'Woensdag', title: 'Poep kookt', description: '' },
	{ id: 4, date: 'Donderdag', title: 'blabkla', description: '' },
	{ id: 5, date: 'Vrijdag', title: 'blabalbla', description: '' },
];

useSeoMeta({
	title: "47 Dashboard"
})
</script>

<style scoped></style>