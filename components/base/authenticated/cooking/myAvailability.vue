<template>
	<UiCalendar :attributes="attributes" borderless expanded :first-day-of-week="2" locale="nl"
		:masks="{ weekdays: 'WW' }" title-position="right" />
</template>

<script lang="ts" setup>
import { type Availability, type BlockedDay, type MonthRoster } from "@prisma/client";

type extraStuff = {
	availabilities: Availability[],
	blockedDates: BlockedDay[]
}
// Await data
const { data: avaldata, error: avalerror } = await useAPI<(MonthRoster & extraStuff)[]>("/api/cooking/availability");
if (avalerror.value) {
	useSonner.error("Kon geen maand data ophalen");
}

const attributes = ref([]);

let currentYear = new Date().getFullYear()
let currentMonth = new Date().getMonth() + 1

onMounted(() => {
	if (!avaldata.value) return;

	// Get current month's data
	const currentMonthData = avaldata.value.find(
		x => x.month === currentMonth && x.year === currentYear
	);

	if (!currentMonthData) return;

	// Create attribute groups by availability type
	const availabilityGroups = {
		AVAILABLE: {
			bar: "green",
			popover: { label: "Beschikbaar" },
			dates: [] as Date[],
		},
		UNAVAILABLE: {
			bar: "red",
			popover: { label: "Niet beschikbaar" },
			dates: [] as Date[],
		},
		POSITIVE: {
			bar: "indigo",
			popover: { label: "Graag" },
			dates: [] as Date[],
		},
		NEGATIVE: {
			bar: "yellow",
			popover: { label: "Liever niet" },
			dates: [] as Date[],
		},
	};

	// Group dates by availability
	currentMonthData.availabilities.forEach(av => {
		const date = new Date(currentYear, currentMonth - 1, av.day);
		if (av.availability in availabilityGroups) {
			availabilityGroups[av.availability as keyof typeof availabilityGroups].dates.push(date);
		}
	});

	// Set attributes array
	attributes.value = Object.values(availabilityGroups).filter(group => group.dates.length > 0);
});
</script>

<style></style>