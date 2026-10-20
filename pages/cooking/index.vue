<template>
	<div class="-mx-3 grid min-w-0 grid-cols-1 gap-4 sm:mx-0 lg:grid-cols-4">
		<div class="min-w-0 lg:col-span-3">
			<UiCard class="w-full min-w-0" title="Kokers deze maand">
				<template #content>
					<UiCardContent class="min-w-0 !px-2 sm:!px-6">
						<div class="mb-3 flex items-center justify-end gap-2">
							<UiLabel for="show-roster-weekends" class="text-sm">Toon weekenddagen</UiLabel>
							<UiSwitch id="show-roster-weekends" v-model:checked="showWeekends" />
						</div>
						<div class="cooking-roster-calendar min-w-0 max-w-full overflow-x-auto">
							<FullCalendar :options="calendarOptions" />
						</div>
						<p v-if="currentMonthRoster && !currentMonthRoster.assignedDays.length"
							class="mt-3 text-center text-sm text-muted-foreground">
							Er zijn nog geen koks voor deze maand ingedeeld.
						</p>
						<p v-else-if="currentMonthRoster === null" class="mt-3 text-center text-sm text-muted-foreground">
							Er is nog geen rooster voor deze maand.
						</p>
					</UiCardContent>
				</template>
			</UiCard>
		</div>
		<div class="min-w-0 lg:col-start-4 lg:row-start-1">
			<UiCard class="w-full min-w-0" title="Je beschikbaarheid">
				<template #content>
					<UiCardContent class="min-w-0">
						<BaseAuthenticatedCookingMyAvailability
							:year="displayedMonth.getFullYear()"
							:month="displayedMonth.getMonth() + 1"
						/>
					</UiCardContent>
				</template>
			</UiCard>
		</div>
		<!-- <div class="row-span-3 col-start-4 row-start-3">
			<BaseAuthenticatedHomeUserOverview />
		</div> -->
	</div>
</template>

<script setup lang="ts">
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import FullCalendar from "@fullcalendar/vue3";
import type { CalendarOptions } from "@fullcalendar/core";
import { usePageInfoStore } from '~/composables/usePageInfoStore';
import { ref } from 'vue';
import type { CurrentMonthRosterDto } from "~/types/dto";

usePageInfoStore().setPageInfo({
	title: 'Koken',
});

useSeoMeta({
	title: "Koken - Dashboard"
})


const displayedMonth = ref(new Date());
const showWeekends = ref(false);
const rosterUrl = computed(
	() => `/api/cooking?year=${displayedMonth.value.getFullYear()}&month=${displayedMonth.value.getMonth() + 1}`
);
const { data: currentMonthRoster, error } = await useAPI<CurrentMonthRosterDto | null>(
	() => rosterUrl.value
);

if (error.value) {
	useSonner.error(error.value.statusMessage ?? "Kon de indeling van deze maand niet ophalen.");
}

const calendarOptions = computed<CalendarOptions>(() => ({
	locale: "nl",
	plugins: [dayGridPlugin, interactionPlugin],
	initialView: "dayGridMonth",
	firstDay: 1,
	hiddenDays: showWeekends.value ? [] : [0, 5, 6],
	stickyHeaderDates: true,
	editable: false,
	headerToolbar: {
		left: "prevYear,prev,today,next,nextYear",
		center: "title",
		right: "dayGridWeek,dayGridMonth",
	},
	datesSet: (info) => {
		const date = info.view.calendar.getDate();
		if (
			displayedMonth.value.getFullYear() !== date.getFullYear() ||
			displayedMonth.value.getMonth() !== date.getMonth()
		) {
			displayedMonth.value = new Date(date.getFullYear(), date.getMonth(), 1);
		}
	},
	events: (currentMonthRoster.value?.assignedDays ?? []).map((assignment) => ({
		title: `${assignment.cookingGroup.name}: ${assignment.user.name}`,
		start: new Date(
			currentMonthRoster.value.year,
			currentMonthRoster.value.month - 1,
			assignment.day
		),
		allDay: true,
	})),
}));

</script>

<style scoped>
@media (max-width: 639px) {
	.cooking-roster-calendar :deep(.fc .fc-daygrid-day-frame) {
		min-height: 5rem;
	}

	.cooking-roster-calendar :deep(.fc .fc-toolbar-title) {
		font-size: 1.125rem;
	}

	.cooking-roster-calendar :deep(.fc .fc-button) {
		height: 2rem;
		padding-inline: 0.5rem;
		font-size: 0.75rem;
	}

	.cooking-roster-calendar :deep(.fc .fc-col-header-cell-cushion),
	.cooking-roster-calendar :deep(.fc .fc-daygrid-day-number) {
		font-size: 0.75rem;
		line-height: 1rem;
	}

	.cooking-roster-calendar :deep(.fc .fc-daygrid-event) {
		font-size: 0.625rem;
		line-height: 0.875rem;
	}
}
</style>
