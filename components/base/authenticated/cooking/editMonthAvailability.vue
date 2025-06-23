<template>
	<!-- Dialog -->
	<BaseAuthenticatedCookingPersonDayBrowser ref="dayBrowserRef" :selected-date-string="hoverDate"
		:group-info="sidebarGroups" @savePerson="saveCookingPerson">
	</BaseAuthenticatedCookingPersonDayBrowser>
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
		<UiCard title="Kookleden" class="mb-4">
			<template #content>
				<UiCardContent>
					<p class="mb-2">Druk op een persoon en bekijk de beschikbaarheid van alleen dat persoon.</p>
					<BaseAuthenticatedCookingUserShower v-if="sidebarGroups" :group-info="sidebarGroups"
						ref="userShowerRef" />
				</UiCardContent>
			</template>
		</UiCard>
		<UiCard title="Legenda">
			<template #content>
				<UiCardContent>
					<!-- TODO: Maak dit mooi ofzo -->
					<div class="flex flex-auto gap-4 pb-4">
						<div class="bg-av-avail rounded-md ring-offset-background px-4 py-2">{{
							availabilityTranslations.AVAILABLE }}</div>
						<div class="bg-av-unavail rounded-md ring-offset-background px-4 py-2">{{
							availabilityTranslations.UNAVAILABLE }}</div>
					</div>
					<div class="flex flex-auto gap-4">
						<div class="bg-av-posi rounded-md ring-offset-background px-4 py-2">
							{{ availabilityTranslations.POSITIVE }}</div>
						<div class="bg-av-nega rounded-md ring-offset-background px-4 py-2">{{
							availabilityTranslations.NEGATIVE }}</div>
					</div>
				</UiCardContent>
			</template>
		</UiCard>
	</div>
</template>

<script lang="ts" setup>
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin, { type DateClickArg } from "@fullcalendar/interaction";
import type { GroupUsersDto, ManageMonthDto } from '~/types/dto';
import { BaseAuthenticatedCookingPlannercontrols, BaseAuthenticatedCookingUserShower, BaseAuthenticatedCookingPersonDayBrowser } from '#components';
import { AvailabilityType } from "@prisma/client"; import FullCalendar from "@fullcalendar/vue3";
import { availabilityTranslations } from "~/i18n/enumTranslations";
import dayjs from "dayjs";
import Plannercontrols from "./plannercontrols.vue";

// 0-based month number
const props = defineProps<{
	month: ManageMonthDto
	groupData: GroupUsersDto[]
}>()

// TYPES
type CookingChooserType = InstanceType<typeof BaseAuthenticatedCookingPlannercontrols>;
type UserShowerType = InstanceType<typeof BaseAuthenticatedCookingUserShower>;
type DayBrowserType = InstanceType<typeof BaseAuthenticatedCookingPersonDayBrowser>;
type ModeType = "FullOverview" | "CookingGroupSelect" | "PersonSelect"

// REFS
const cookingChooserRef = useTemplateRef<CookingChooserType>('cookingChooser')
const calendarRef = ref<InstanceType<typeof FullCalendar> | null>(null);
const userShowerRef = useTemplateRef<UserShowerType>('userShowerRef')
const dayBrowser = useTemplateRef<DayBrowserType>('dayBrowserRef')
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

watch(
	() => cookingChooserRef.value?.selectedGroupName,
	(name) => {
		if (name) {
			// Set to a value (cooking group selected)
			oldMode.value = mode.value
			mode.value = "CookingGroupSelect"
		} else {
			// group deselected
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
	let dateObj = new Date(hoverDate.value);
	let day = dateObj.getDate();
	if (hoverDate.value == '') {
		day = new Date().setFullYear(1900)
	}
	// For all users, map their availability to the data
	data.forEach(group => {
		// TODO: Betere manier om te testen of iemand geen groep heeft
		if (group.name != "Geen groep") {
			// Should we show availability outside of current month? No
			const shouldHaveAvailabilities = ((dateObj.getMonth() + 1) == selectedMonth.value.month) && !selectedMonth.value.blockedDates.some(x => x.day == day);
			if (shouldHaveAvailabilities) {
				group.people.map(x => x.availability = selectedMonth.value.availabilities.find(y => y.userId == x.id && y.day == day)?.availability!)
			} else {
				group.people.map(x => x.availability = undefined)
			}
		}
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

		const daysInMonth = new Date(selectedMonth.value.year, selectedMonth.value.month + 1, 0).getDate()

		for (let index = 1; index <= daysInMonth; index++) {
			const count = availabilityCounts.get(index) ?? 0;

			const dayobj = dayjs().set("month", selectedMonth.value.month - 1).set("year", selectedMonth.value.year).set("date", index);

			events.push({
				start: dayobj.format("YYYY-MM-DD"),
				display: "background",
				backgroundColor: `rgba(110, 231, 183, ${count / selectedMonth.value.maxAssigned})`,
				allDay: true,
			});
		}

	} else if (mode.value == "PersonSelect") {
		// Show the availability of the selected person
		// If user did not fill in, they have zero availabilitiues.
		selectedMonthPerson.value.availabilities.forEach(x => {
			const dayobj = dayjs().set("month", selectedMonth.value.month - 1).set("year", selectedMonth.value.year).set("date", x.day);

			events.push({
				start: dayobj.format("YYYY-MM-DD"),
				display: "background",
				backgroundColor: getColorForAvailability(x.availability),
				allDay: true,
			});
		})

		return events;
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
		eventMouseEnter: (info: any) => { // Does not work if day hovered over is empty!
			hoverDate.value = (info.event.start as Date).toString();
		},
		eventMouseLeave: () => {
			if (dayBrowser.value?.opened) {
				return
			}
			hoverDate.value = "";
		},
		dateClick: (info: DateClickArg) => {
			clickDate(info);
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

const clickDate = (info: DateClickArg) => {
	if (mode.value != "CookingGroupSelect") {
		useSonner.warning("Je moet een kookgroep selecteren om het rooster in te delen")
		return;
	}

	// Popup day browser
	if (selectedMonth.value.month != info.date.getMonth() + 1) {
		return
	}
	if (selectedMonth.value.blockedDates.some(x => info.date.getDate() == x.day)) {
		return
	}
	dayBrowser.value?.openDialog();
}

const saveCookingPerson = (selectedPerson: { id: Number, name: String }, selectedDateString: String) => {
	console.log("Saved person!")
	console.dir(selectedPerson)
	console.dir(selectedDateString)
	const dateToAdd = new Date(selectedDateString.toString());
	calendarRef.value?.getApi().addEvent({
		title: "K2: Je moeder kookt ofzo",
		allDay: true,
		start: dateToAdd
	})
}
</script>

<style></style>