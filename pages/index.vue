<template>
	<div class="grid grid-cols-3 grid-rows-3 gap-4">
		<UiCard class="w-100" title="Vandaag">
			<template #content>
				<UiList class="max-w-m">
					<UiListItem class="px-6">
						<Icon name="lucide:chef-hat" class="size-10 text-primary" />
						<UiListContent>
							<UiListTitle title="Froukje kookt voor K1" />
							<UiListSubtitle class="line-clamp-2"
								subtitle="Froukje zorgt voor een maaltijd met vleesch" />
						</UiListContent>
					</UiListItem>
					<UiListItem class="px-6">
						<Icon name="lucide:chef-hat" class="size-10 text-primary" />
						<UiListContent>
							<UiListTitle title="Sjoerd kookt voor K2" />
							<UiListSubtitle class="line-clamp-2" subtitle="Sjoerd zorgt voor vuige vega stuckjes" />
						</UiListContent>
					</UiListItem>
					<!-- Schoonmaak -->
					<UiListItem class="px-6">
						<Icon name="lucide:toilet" class="size-10 text-primary" />
						<UiListContent>
							<UiListTitle title="De WC's worden schoongemaakt" />
							<UiListSubtitle class="line-clamp-2" subtitle="Vandaag maken Berg en Justin schoon" />
						</UiListContent>
					</UiListItem>
				</UiList>
			</template>
		</UiCard>
		<UiCard class="w-100" title="Statistieken">
			<template #content>
				<UiList class="max-w-m">
					<UiListItem class="px-6">
						<Icon name="lucide:trending-up" class="size-10 text-primary" />
						<UiListContent>
							<UiListTitle title="Je hebt 10 kookpunten" />
							<UiListSubtitle class="line-clamp-2"
								subtitle="De punten zijn met 4 omhooggegaan na de laatste keer dat je hebt afgewassen" />
							<!-- Of, ze zijn gedaald omdat Justin je sancties heeft gegeven voor het niet schoonmaken
									 van de wc (trending-down)-->
						</UiListContent>
					</UiListItem>
					<!-- Schoonmaak -->
					<UiListItem class="px-6">
						<Icon name="lucide:cooking-pot" class="size-10 text-primary" />
						<UiListContent>
							<UiListTitle title="Jouw kookdagen deze week" />
							<UiListSubtitle class="line-clamp-2" subtitle="Jij moet koken op maandag en donderdag" />
							<!-- Je hoeft niet te koken deze week -->
						</UiListContent>
					</UiListItem>
					<UiListItem class="px-6">
						<Icon name="lucide:brush-cleaning" class="size-10 text-primary" />
						<UiListContent>
							<UiListTitle title="Volgende keer dat je schoon moet maken" />
							<UiListSubtitle class="line-clamp-2"
								subtitle="Jij moet als volgende de woonkamer schoonmaken met als extra taak de kastjes" />
						</UiListContent>
					</UiListItem>
				</UiList>
			</template>
		</UiCard>
		<BaseAuthenticatedHomeUserOverview class="row-span-3" />
		<div class="col-span-2">
			<UiCard class="mt-8" title="Schema van deze week" :description="weekRange">
				<template #content>
					<UiCardContent>
						<UiTimeline :model-value="3" orientation="horizontal">
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
					</UiCardContent>
				</template>
			</UiCard>
		</div>
	</div>

	<!-- Weekly Schedule Timeline Overview -->



</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

usePageInfoStore().setPageInfo({
	title: 'Dashboard',
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
	{ id: 1, date: 'Maandag', title: 'Justin kookt', description: 'Schoonmaken: Sarah' },
	{ id: 2, date: 'Dinsdag', title: 'Sarah kookt', description: 'Schoonmaken: Mike' },
	{ id: 3, date: 'Woensdag', title: 'Poep kookt', description: 'Schoonmaken: Emma' },
	{ id: 4, date: 'Donderdag', title: 'blabkla', description: 'Schoonmaken: John' },
	{ id: 5, date: 'Vrijdag', title: 'blabalbla', description: 'Schoonmaken: Sarah' },
];

useSeoMeta({
	title: "47 Dashboard"
})
</script>

<style scoped></style>