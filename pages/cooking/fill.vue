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
			<UiCard class="w-100" title="Hoe gebruik je dit?">
				<template #content>
					<UiCardContent>
						Klik en sleep om een range aan data te selecteren. <br />
						Gebruik daarna de knoppen rechts om je data aan te passen, of druk op <UiKbd>X</UiKbd>, <UiKbd>V
						</UiKbd>, <UiKbd>-</UiKbd> of <UiKbd>+</UiKbd>
					</UiCardContent>
				</template>
			</UiCard>
		</div>
		<div>
			<UiCard class="w-100" title="Selectie acties">
				<template #content>
					<UiCardContent>
						<div class="grid grid-cols-4 gap-2 pb-4">
							<!-- Kan niet -->
							<UiButton class="w-full" variant="destructive"
								@click="updateSelectedDatesAvailability('UNAVAILABLE')"
								:disabled="selecteddates.length === 0">
								<Icon class="size-4" name="lucide:x" />
							</UiButton>
							<!-- Default state; ik kan WEL -->
							<UiButton class="w-full" variant="positive"
								@click="updateSelectedDatesAvailability('AVAILABLE')"
								:disabled="selecteddates.length === 0">
								<Icon class="size-4" name="lucide:check" />
							</UiButton>
							<!-- Liever niet -->
							<UiButton class="w-full" variant="caution"
								@click="updateSelectedDatesAvailability('NEGATIVE')"
								:disabled="selecteddates.length === 0">
								<Icon class="size-4" name="lucide:minus" />
							</UiButton>
							<!-- Graag -->
							<UiButton class="w-full" variant="constructive"
								@click="updateSelectedDatesAvailability('POSITIVE')"
								:disabled="selecteddates.length === 0">
								<Icon class="size-4" name="lucide:plus" />
							</UiButton>
						</div>
						<div class="flex justify-between gap-2 pt-2 border-t">
							<UiButton variant="outline" class="w-full" @click="resetAvailability">Annuleren</UiButton>
							<UiButton variant="default" class="w-full">Opslaan</UiButton>
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
import { computed, onMounted, ref, watch } from 'vue';
import type { CalendarOptions } from "@fullcalendar/core";
import { AvailabilityType } from "@prisma/client";
import { usePageInfoStore } from '~/composables/usePageInfoStore';
import { useCookingStore } from '~/composables/useCookingStore';

usePageInfoStore().setPageInfo({
	title: 'Beschikbaarheid',
});

useSeoMeta({
	title: "Koken - Beschikbaarheid"
})

type SelectedDate = {
	date: Date,
	availability: AvailabilityType
}

const cookingStore = useCookingStore();
const selecteddates = ref<Date[]>([]);

// Get dates from store or initialize to empty array
const dates = ref<SelectedDate[]>([]);
// Keep backup for reset
let olddates: SelectedDate[] = [];

// Initialize from store
onMounted(() => {
	const storedDates = cookingStore.getAvailability();
	if (storedDates && storedDates.length > 0) {
		dates.value = storedDates;
	} else {
		// First fill in dates if store is empty
		for (let date = startOfMonth; date.isBefore(endOfMonth); date = date.add(1, "day")) {
			// Skip weekends if necessary
			if (date.day() === 0 || date.day() === 6) continue;

			const toAdd: SelectedDate = {
				date: date.toDate(),
				availability: "AVAILABLE"
			}

			dates.value.push(toAdd);
		}

		olddates = dates.value;
		console.log("Old dates set as:")
		console.log(olddates)
	}
});

// Watch for changes and update store
watch(dates, (newDates) => {
	cookingStore.setAvailability(newDates);
}, { deep: true });

const resetAvailability = () => {
	console.log(olddates);
	dates.value = olddates;
}

const updateSelectedDatesAvailability = (availability: AvailabilityType) => {
	selecteddates.value.forEach(selected => {
		const dateStr = dayjs(selected).format('YYYY-MM-DD');
		const existingDateIndex = dates.value.findIndex(
			d => dayjs(d.date).format('YYYY-MM-DD') === dateStr
		);

		if (existingDateIndex !== -1) {
			dates.value[existingDateIndex].availability = availability;
		}
	});

	// Clear selection after updating
	selecteddates.value = [];
};

// Get month range
const today = dayjs();
const startOfMonth = today.startOf("month");
const endOfMonth = today.endOf("month");

const getColorForAvailability = (availability?: AvailabilityType) => {
	switch (availability) {
		case 'UNAVAILABLE':
			return '#ef4444'; // red
		case 'AVAILABLE':
			return '#22c55e'; // green
		case "POSITIVE":
			return '#3b82f6'; // blue
		case "NEGATIVE":
			return '#f59e0b'; // amber
		default:
			return '#e2e8f0'; // slate-200
	}
};

const getAvailableEventsForMonth = computed(() => {
	const events: any[] = [];

	for (let date = dayjs(startOfMonth); date.isBefore(endOfMonth); date = date.add(1, "day")) {
		// Skip weekends if necessary
		if (date.day() === 0 || date.day() === 6) continue;

		const dateStr = date.format("YYYY-MM-DD");
		const existingDate = dates.value.find(d => dayjs(d.date).format("YYYY-MM-DD") === dateStr);

		if (existingDate) {
			events.push({
				start: dateStr,
				display: "background",
				backgroundColor: getColorForAvailability(existingDate.availability),
				allDay: true,
			});
		}
	}

	return events;
});

// TODO: selectConstraint to make the user not be able to
// select dates that have been marked as unneeded
// eventOverlap!
const calendarOptions = computed((): CalendarOptions => ({
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
	events: getAvailableEventsForMonth.value, select: function (info) {
		selecteddates.value = [];

		// Selected range or day
		let startDate = info.start;

		while (startDate < info.end) {
			selecteddates.value.push(new Date(startDate));

			// Move to the next day
			startDate.setDate(startDate.getDate() + 1);
		}
	}
}));

</script>
