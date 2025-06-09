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
					</UiCardContent>
				</template>
			</UiCard>
		</div>
		<div class="row-span-2 col-start-4 row-start-1">
			<UiCard class="w-100" title="Je beschikbaarheid">
				<template #content>
					<UiCardContent>
						<BaseAuthenticatedCookingMyAvailability />
					</UiCardContent>
				</template>
			</UiCard>
		</div>
		<div class="row-span-3 col-start-4 row-start-3">
			<BaseAuthenticatedHomeUserOverview />
		</div>
	</div>
</template>

<script setup lang="ts">
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import FullCalendar from "@fullcalendar/vue3";
import dayjs from "dayjs";
import type { CalendarOptions } from "@fullcalendar/core";
import { usePageInfoStore } from '~/composables/usePageInfoStore';
import { useRoute } from "vue-router";
import { ref, watch, onBeforeUnmount } from 'vue';

usePageInfoStore().setPageInfo({
	title: 'Koken',
});

useSeoMeta({
	title: "Koken - Dashboard"
})


const calendarOptions: CalendarOptions = {
	locale: "nl",
	plugins: [dayGridPlugin, interactionPlugin],
	initialView: "dayGridMonth",
	dateClick: (info) => {
		console.log(info.dateStr);
	},
	firstDay: 1,
	stickyHeaderDates: true,
	editable: false,
	headerToolbar: {
		left: "prevYear,prev,today,next,nextYear",
		center: "title",
		right: "dayGridWeek,dayGridMonth",
	},
	events: [
		{
			title: "Justin",
			date: dayjs().toDate().toISOString(),
			url: "https://ui-thing.behonbaker.com/",
			allDay: true,
		},
		{
			title: "Danny",
			date: dayjs().add(1, "day").format("YYYY-MM-DD"),
			allDay: true,
		},
	],
};

// const { data: currentMonthRoster } = await useAPI<MonthRoster>("/api/cooking")

let nextMonthDate = new Date()
nextMonthDate.setMonth(nextMonthDate.getMonth() + 1)

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
