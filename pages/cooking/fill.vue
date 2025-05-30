<template>
	<div class="grid grid-cols-4 grid-rows-5 gap-4">
		<div class="col-span-3 row-span-5">
			<UiCard class="w-100" title="Vul je beschikbaarheid in">
				<template #content>
					<UiCardContent>
						<!-- keep-alive for making sure that the tab does not go white -->
						<keep-alive>
							<FullCalendar :options="calendarOptions" />
						</keep-alive>
					</UiCardContent>
				</template>
			</UiCard>
		</div>
		<div class="col-start-4">
			<UiCard class="w-100" title="Handige informatie">
				<template #content>
					<UiCardContent>
						Klik en sleep om een range aan data te selecteren.
						Gebruik de knoppen rechts om je data aan te passen
					</UiCardContent>
				</template>
			</UiCard>
		</div>
		<div>
			<UiCard class="w-100" title="Selectie acties">
				<template #content>
					<UiCardContent>
						<div class="pb-4">
							Begin te selecteren...
						</div>
						<div class="flex justify-evenly">
							<!-- Kan niet -->
							<UiButton variant="destructive">
								<Icon class="size-4" name="lucide:x" />
							</UiButton>
							<!-- Default state; ik kan WEL -->
							<UiButton>
								<Icon class="size-4" name="lucide:check" />
							</UiButton>

							<UiSeparator orientation="vertical" />

							<!-- Liever niet -->
							<UiButton>
								<Icon class="size-4" name="lucide:minus" />
							</UiButton>
							<!-- Graag -->
							<UiButton>
								<Icon class="size-4" name="lucide:plus" />
							</UiButton>
						</div>
					</UiCardContent>
				</template>
			</UiCard>
		</div>
	</div>
</template>

<script setup lang="ts">
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import FullCalendar from "@fullcalendar/vue3";
import dayjs from "dayjs";
import type { CalendarOptions } from "@fullcalendar/core";
import { AvailabilityType } from "@prisma/client";
import { usePageInfoStore } from '~/composables/usePageInfoStore';

usePageInfoStore().setPageInfo({
	title: 'Beschikbaarheid',
});

useSeoMeta({
	title: "Koken - Beschikbaarheid"
})

type SelectedDate = {
	date: Date,
	availability?: AvailabilityType
}

let selecteddates: SelectedDate[] = [];
// Await data

// TODO: selectConstraint to make the user not be able to
// select dates that have been marked as unneeded
const calendarOptions: CalendarOptions = {
	locale: "nl",
	plugins: [dayGridPlugin, interactionPlugin],
	initialView: "dayGridMonth",
	weekends: false,
	firstDay: 1,
	stickyHeaderDates: true,
	editable: false,
	headerToolbar: {
		left: "prevYear,prev,today,next,nextYear",
		center: "title",
		right: "dayGridWeek,dayGridMonth",
	},
	selectable: true,
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
	select: function (info) {
		selecteddates = [];

		// Selected range or day
		let startDate = info.start;

		while (startDate < info.end) {
			selecteddates.push({
				date: new Date(startDate),
			});

			// Move to the next day
			startDate.setDate(startDate.getDate() + 1);
		}
	}
};

</script>
