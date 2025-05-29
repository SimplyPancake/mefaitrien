<template>
	<div class="grid grid-cols-4 grid-rows-5 gap-4">
		<div class="col-span-3 row-span-5">
			<UiCard class="w-100" title="Kokers deze maand">
				<template #content>
					<FullCalendar class="p-6" :options="calendarOptions" />
				</template>
			</UiCard>
		</div>
		<div class="row-span-2 col-start-4 row-start-1">
			<UiCard class="w-100" title="Je beschikbaarheid">
				<template #content>
					<UiCalendar class="p-2" :attributes="attributes" borderless expanded :first-day-of-week="2"
						locale="nl" :masks="{ weekdays: 'WW' }" title-position="right" />
				</template>
			</UiCard>
			<UiCardContent>
			</UiCardContent>
		</div>
		<div class="row-span-3 col-start-4 row-start-3">
			<BaseAuthenticatedHomeUserOverview></BaseAuthenticatedHomeUserOverview>
		</div>
	</div>
</template>

<script setup lang="ts">
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import FullCalendar from "@fullcalendar/vue3";
import dayjs from "dayjs";
import { addDays, startOfMonth, startOfToday } from "date-fns";
import type { CalendarOptions } from "@fullcalendar/core";
import { usePageInfoStore } from '~/composables/usePageInfoStore';
usePageInfoStore().setPageInfo({
	title: 'Koken',
});

useSeoMeta({
	title: "Koken Dashboard"
})

// Await data

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

let currentYear = new Date().getFullYear()
let currentMonth = new Date().getMonth() + 1

// const { data: currentMonthRoster } = await useAPI<MonthRoster>("/api/cooking")

let dateFormatter = new Intl.DateTimeFormat('nl', { month: 'long' })
let nextMonthDate = new Date()
nextMonthDate.setMonth(nextMonthDate.getMonth() + 1)
let nextMonthName = dateFormatter.format(nextMonthDate)

const attributes = ref([
	{
		bar: "green",
		popover: {
			label: "Beschikbaar"
		},
		dates: addDays(startOfMonth(startOfToday()), 8).toString()
	},
	{
		bar: "red",
		popover: {
			label: "Niet beschikbaar"
		},
		dates: addDays(startOfMonth(startOfToday()), 2).toString()
	}
])
</script>
