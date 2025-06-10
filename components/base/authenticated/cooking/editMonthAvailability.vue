<template>
	<div class="col-span-2 row-span-5 row-start-3 animate-fadeIn">
		<UiCard title="Creeer of wijzig maand">
			<template #content>
				<UiCardContent>
					<BaseAuthenticatedCookingPlannercontrols v-if="groupData" :group-info="props.groupData"
						ref="cookingChooser" />

					<!-- If selectedGroup is empty; display empty calendar with selected month -->

					<!-- Else, display calendar with month data of that group -->
					<KeepAlive>
						<FullCalendar ref="calendarRef" :options="calendarOptions" />
					</KeepAlive>
				</UiCardContent>
			</template>
		</UiCard>
	</div>
	<div class="row-span-5 col-start-3 row-start-3 animate-fadeIn">
		<UiCard title="Kookleden">
			<template #content>
				<UiCardContent>
					<p class="mb-2">Druk op een persoon en bekijk de beschikbaarheid van alleen dat persoon.</p>
					<BaseAuthenticatedCookingUserShower v-if="sidebarGroups" :group-info="sidebarGroups" />
				</UiCardContent>
			</template>
		</UiCard>
	</div>
</template>

<script lang="ts" setup>
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { GroupUsersDto, ManageMonthDto } from '~/types/dto';
import { BaseAuthenticatedCookingPlannercontrols } from '#components';
// import type FullCalendar from '@fullcalendar/vue3';
import FullCalendar from "@fullcalendar/vue3";
import type { CalendarOptions } from "@fullcalendar/core/index.js";
import dayjs from "dayjs";

// 0-based month number
const props = defineProps<{
	month: ManageMonthDto
	groupData: GroupUsersDto[]
}>()

// TYPES
type CookingChooserType = InstanceType<typeof BaseAuthenticatedCookingPlannercontrols>;
type ModeType = "FullOverview" | "CookingGroupSelect" | "PersonSelect"

// REFS
const cookingChooserRef = useTemplateRef<CookingChooserType>('cookingChooser')
const calendarRef = ref<InstanceType<typeof FullCalendar> | null>(null);
const mode = ref<ModeType>("CookingGroupSelect")

// COMPUTED
const selectedMonth = computed(() => {
	if (!cookingChooserRef.value?.selectedGroupName) {
		return props.month
	}

	return {
		...props.month,
		availabilities: props.month.availabilities.filter(x => x.user.cookingGroupId == cookingChooserRef.value?.selectedGroup?.id),
		maxAssigned: cookingChooserRef.value?.selectedGroup?.people.length ?? props.month.maxAssigned
	}
})

const sidebarGroups = computed(() => {
	// If no group is selected, return all groups
	if (cookingChooserRef.value?.selectedGroupName !== '') {
		const selectedGroup = cookingChooserRef.value?.selectedGroup;
		return selectedGroup ? [selectedGroup] : [];
	}

	// Otherwise, return all groups from groupData
	return props.groupData ?? [];
})

const calendarEvents = computed(() => {
	// Add blocked days!
	const events: any[] = [];
	selectedMonth.value.blockedDates.forEach((blockedDay) => {
		const day = dayjs().set("month", selectedMonth.value.month - 1).set("year", selectedMonth.value.year).set("date", blockedDay.day)

		events.push({
			start: day.format("YYYY-MM-DD"),
			display: "background",
			backgroundColor: `#e5e7eb`,
			allDay: true,
		});
	})

	switch (mode.value) {
		case "CookingGroupSelect":
			// Compute density of available
			const availabilityCounts = new Map<number, number>();

			selectedMonth.value.availabilities.forEach((availability) => {
				if (availability.availability !== "UNAVAILABLE") {
					availabilityCounts.set(
						availability.day,
						(availabilityCounts.get(availability.day) || 0) + 1
					);
				}
			});

			availabilityCounts.forEach((count, day) => {
				const dateStr = `${selectedMonth.value.year}-${String(
					selectedMonth.value.month
				).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

				events.push({
					start: dateStr,
					display: "background",
					backgroundColor: `rgba(110, 231, 183, ${count / selectedMonth.value.maxAssigned})`,
					allDay: true,
				});
			});

			return events;

		default:
			return [];
	}
})

const calendarOptions = ref<CalendarOptions>({
	locale: "nl",
	plugins: [dayGridPlugin, interactionPlugin],
	initialView: "dayGridMonth",
	// weekends: false,
	firstDay: 1,
	stickyHeaderDates: true,
	editable: false,
	headerToolbar: {
		left: "",
		center: "",
		right: "",
	},
	selectable: false,
	events: calendarEvents.value
});
// TWO MODES
// 1. Select user from sidebar and view their availability
// 2. Select a date and view available users
</script>

<style></style>