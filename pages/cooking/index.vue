<template>
	<div class="grid grid-cols-4 grid-rows-5 gap-4">
		<div class="col-span-3 row-span-5">
			<UiCard class="w-100" title="Kokers deze maand">
				<template #content>
					<UiCardContent>
						<!-- keep-alive for making sure that the tab does not go white -->
						<KeepAlive>
							<FullCalendar :options="calendarOptions" :key="calendarKey" />
						</KeepAlive>
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
		<div class="row-span-2 col-start-4 row-start-1">
			<UiCard class="w-100" title="Je beschikbaarheid">
				<template #content>
					<UiCardContent>
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
import { useRoute } from "vue-router";
import { ref, watch, onBeforeUnmount } from 'vue';
import type { CurrentMonthRosterDto } from "~/types/dto";

usePageInfoStore().setPageInfo({
	title: 'Koken',
});

useSeoMeta({
	title: "Koken - Dashboard"
})


const displayedMonth = ref(new Date());
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

const calendarKey = ref(0);
const route = useRoute();

const calendarRef = ref<InstanceType<typeof FullCalendar> | null>(null);

// Increment the key when switching tabs to force re-rendering if needed
watch(() => route.path, () => {
	calendarKey.value++;
});

onBeforeUnmount(() => {
	const calendarApi = calendarRef.value?.getApi();
	if (calendarApi) {
		try {
			calendarApi.destroy();
		} catch (error) {
			console.warn('Error while destroying calendar:', error);
		}
	}
});
</script>
