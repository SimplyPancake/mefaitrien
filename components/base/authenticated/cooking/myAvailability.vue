<template>
	<div class="w-full min-w-0">
		<UiCalendar
			:key="`${props.year}-${props.month}`"
			:initial-page="{ year: props.year, month: props.month }"
			:attributes="attributes"
			class="w-full max-w-full"
			borderless
			expanded
			:first-day-of-week="2"
			locale="nl"
			:masks="{ weekdays: 'WW' }" title-position="right" />
		<p v-if="avaldata && !currentMonthData?.availabilities.length"
			class="mt-2 text-center text-sm text-muted-foreground">
			Geen beschikbaarheid voor deze maand gevonden.
		</p>
	</div>
</template>

<script lang="ts" setup>
import { type Availability, type BlockedDay, type MonthRoster } from "@/generated/prisma/browser";

const props = defineProps<{
	year: number;
	month: number;
}>();

type extraStuff = {
	availabilities: Availability[],
	blockedDates: BlockedDay[]
}
// Await data
const { data: avaldata, error: avalerror } = await useAPI<(MonthRoster & extraStuff)[]>("/api/cooking/availability");
if (avalerror.value) {
	useSonner.error(avalerror.value.statusMessage ?? "Kon geen maand data ophalen");
}

const currentMonthData = computed(() => {
	return avaldata.value?.find(
		roster => roster.month === props.month && roster.year === props.year
	);
});

const attributes = computed(() => {
	if (!currentMonthData.value) return [];

	const availabilityGroups = {
		AVAILABLE: {
			bar: { style: { backgroundColor: "var(--col-avail)" } },
			popover: { label: "Beschikbaar" },
			dates: [] as Date[],
		},
		UNAVAILABLE: {
			bar: { style: { backgroundColor: "var(--col-unavail)" } },
			popover: { label: "Niet beschikbaar" },
			dates: [] as Date[],
		},
		POSITIVE: {
			bar: { style: { backgroundColor: "var(--col-positive)" } },
			popover: { label: "Graag" },
			dates: [] as Date[],
		},
		NEGATIVE: {
			bar: { style: { backgroundColor: "var(--col-negative)" } },
			popover: { label: "Liever niet" },
			dates: [] as Date[],
		},
	};

	currentMonthData.value.availabilities.forEach(availability => {
		availabilityGroups[availability.availability].dates.push(
			new Date(
				props.year,
				props.month - 1,
				availability.day
			)
		);
	});

	return Object.values(availabilityGroups).filter(group => group.dates.length > 0);
});
</script>

<style></style>