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
						<FullCalendar ref="calendarRef" :options="calendarOptions" class="animate-fadeIn" />
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
					<BaseAuthenticatedCookingUserShower v-if="sidebarGroups" :group-info="sidebarGroups"
						ref="userShowerRef" />
				</UiCardContent>
			</template>
		</UiCard>
	</div>
</template>

<script lang="ts" setup>
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { GroupUsersDto, ManageMonthDto } from '~/types/dto';
import { BaseAuthenticatedCookingPlannercontrols, BaseAuthenticatedCookingUserShower } from '#components';
import { AvailabilityType } from "@prisma/client"; import FullCalendar from "@fullcalendar/vue3";
import dayjs from "dayjs";

// 0-based month number
const props = defineProps<{
	month: ManageMonthDto
	groupData: GroupUsersDto[]
}>()

// TYPES
type CookingChooserType = InstanceType<typeof BaseAuthenticatedCookingPlannercontrols>;
type UserShowerType = InstanceType<typeof BaseAuthenticatedCookingUserShower>;
type ModeType = "FullOverview" | "CookingGroupSelect" | "PersonSelect"

// REFS
const cookingChooserRef = useTemplateRef<CookingChooserType>('cookingChooser')
const calendarRef = ref<InstanceType<typeof FullCalendar> | null>(null);
const userShowerRef = useTemplateRef<UserShowerType>('userShowerRef')
const oldMode = ref<ModeType>("FullOverview")
const mode = ref<ModeType>("FullOverview")
const hoverDate = ref("");

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

const selectedMonthPerson = computed(() => {
	return {
		...selectedMonth.value,
		availabilities: selectedMonth.value.availabilities.filter(x => x.userId == userShowerRef.value?.selectedPerson.id)
	}
})

// WATCH
watch(
	() => userShowerRef.value?.selectedPerson,
	(person) => {
		if (person) {
			// Set to a value (user selected)
			oldMode.value = mode.value
			mode.value = "PersonSelect"
		} else {
			// user deselected
			mode.value = oldMode.value
		}
	})

// COMPUTED

const sidebarGroups = computed(() => {
	let data = props.groupData ?? [];

	// If no group is selected, return all groups
	if (cookingChooserRef.value?.selectedGroupName !== '') {
		const selectedGroup = cookingChooserRef.value?.selectedGroup;
		data = selectedGroup ? [selectedGroup] : [];
	}

	// If a certain day is highlighted, add users' availabilities to group as well
	let day = new Date(hoverDate.value).getDate()
	if (hoverDate.value == '') {
		day = new Date().setFullYear(1900)
	}
	// For all users, map their availability to the data
	data.forEach(group => {
		group.people.map(x => x.availability = selectedMonth.value.availabilities.find(y => y.userId == x.id && y.day == day)?.availability ?? undefined)
	});

	// Otherwise, return all groups from groupData
	return data
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

	if (mode.value == "CookingGroupSelect" || mode.value == "FullOverview") {
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
			const dayobj = dayjs().set("month", selectedMonth.value.month - 1).set("year", selectedMonth.value.year).set("date", day);

			events.push({
				start: dayobj.format("YYYY-MM-DD"),
				display: "background",
				backgroundColor: `rgba(110, 231, 183, ${count / selectedMonth.value.maxAssigned})`,
				allDay: true,
			});
		});

	} else if (mode.value == "PersonSelect") {
		// Show the availability of the selected person
		selectedMonthPerson.value.availabilities.forEach(x => {
			const dayobj = dayjs().set("month", selectedMonth.value.month - 1).set("year", selectedMonth.value.year).set("date", x.day);

			events.push({
				start: dayobj.format("YYYY-MM-DD"),
				display: "background",
				backgroundColor: getColorForAvailability(x.availability),
				allDay: true,
			});
		})
	}

	return events;
})

const calendarOptions = computed(() => {
	return {
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
		events: calendarEvents.value,
		eventMouseEnter: (info: any) => {
			hoverDate.value = info.event.start
			console.log(hoverDate.value)
		},
		eventMouseLeave: () => {
			hoverDate.value = "";
			console.log(hoverDate.value)

		}
	}
});

// FUNCTIONS
const getColorForAvailability = (availability?: AvailabilityType) => {
	switch (availability) {
		case 'UNAVAILABLE':
			return '#fca5a5'; // light red
		case 'AVAILABLE':
			return '#6ee7b7'; // pastel green
		case 'POSITIVE':
			return '#93c5fd'; // light blue
		case 'NEGATIVE':
			return '#fde68a'; // soft yellow
		default:
			return '#e5e7eb'; // light gray
	}
};
</script>

<style></style>