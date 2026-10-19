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
						ref="cookingChooser" @automatic-organize="doAutomaticOrganize()"
						@remove-assigned="removeAssigned()" @submit-assignees="submitAssingees()" />

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
import type { AssignedUsersDto, groupAssign, GroupUsersDto, ManageMonthDto } from '~/types/dto';
import { BaseAuthenticatedCookingPlannercontrols, BaseAuthenticatedCookingUserShower, BaseAuthenticatedCookingPersonDayBrowser } from '#components';
import { AvailabilityType } from "@/generated/prisma/browser"; import FullCalendar from "@fullcalendar/vue3";
import { availabilityTranslations } from "~/i18n/enumTranslations";
import dayjs from "dayjs";
import type { EventClickArg } from "@fullcalendar/core/index.js";

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
const assignedUsers = ref<AssignedUsersDto[]>([]);

// COMPUTED
const selectedMonth = computed(() => {
	// Set calendar to selected month
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
	let obj = {
		...selectedMonth.value,
		availabilities: selectedMonth.value.availabilities.filter(x => x.userId == userShowerRef.value?.selectedPerson?.id) ?? []
	}

	return obj
})

// WATCH
watch(
	() => userShowerRef.value?.selectedPerson,
	(person) => {
		if (person) {
			// Set to a value (user selected)
			mode.value = "PersonSelect"
		} else {
			// user deselected
			oldMode.value = mode.value;
			if (cookingChooserRef.value?.selectedGroupName != '') {
				mode.value = "CookingGroupSelect"
			} else {
				mode.value = "FullOverview"
			}
		}
	})

watch(
	() => cookingChooserRef.value?.selectedGroupName,
	(name) => {
		oldMode.value = mode.value
		if (name != "") {
			// Set to a value (cooking group selected)
			mode.value = "CookingGroupSelect"
		} else {
			// group deselected
			mode.value = "FullOverview";
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

	// Then add all events for assigned persons
	assignedUsers.value.forEach(cookingGroup => {
		if (cookingChooserRef.value?.selectedGroupName) {
			// If a name is selected, then we must filter for that name
			if (cookingGroup.name != cookingChooserRef.value?.selectedGroupName) {
				return;
			}
		}
		cookingGroup.people.forEach(assignedVals => {
			let eventObj = {
				title: `${cookingGroup.name}: ${assignedVals.name}`,
				allDay: true,
				start: assignedVals.date,
				cookingGroupName: cookingGroup.name
			};

			events.push(eventObj)
		})
	});

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
	const dayobj = dayjs().set("month", selectedMonth.value.month - 1).set("year", selectedMonth.value.year)
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
		initialDate: dayobj.format('YYYY-MM-DD'), // set selected month
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
			clickDate(info.date);
		},
		eventClick: (info: EventClickArg) => {
			let isCorrectTypeOfEvent = info.event.display != 'background';
			let cookingGroupName = info.event._def.extendedProps.cookingGroupName ?? "";
			clickDate(info.event.start!, true, isCorrectTypeOfEvent, cookingGroupName)
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

const clickDate = (date: Date, isEvent: boolean = false, isCorrectEvent: boolean = false, cookingGroupName: string = '') => {
	if (isEvent) {
		// Modify event with correct cooking group
		if (isCorrectEvent) {
			// do something
			dayBrowser.value?.openDialog(cookingGroupName);
		}
		return;
	}

	if (mode.value != "CookingGroupSelect") {
		useSonner.warning("Je moet een kookgroep selecteren om het rooster in te delen")
		return;
	}

	if (selectedMonth.value.month != date.getMonth() + 1) {
		return
	}
	if (selectedMonth.value.blockedDates.some(x => date.getDate() == x.day)) {
		return
	}
	dayBrowser.value?.openDialog();
}

function saveCookingPerson(
	selectedPerson: { id: number, name: string },
	dateOrString: Date | string,
	selectedCookingGroupName: string
) {
	const dateToAdd = typeof dateOrString === "string" ? new Date(dateOrString.toString()) : dateOrString;
	const selectedCookingGroup = cookingChooserRef.value!.selectedGroupName == '' ? selectedCookingGroupName : cookingChooserRef.value!.selectedGroupName;
	assignCookingPerson(selectedPerson, selectedCookingGroup, dateToAdd);
}

const assignCookingPerson = (selectedPerson: { id: number, name: string }, cookingGroupName: string, dateToAdd: Date) => {
	if (!assignedUsers.value.some(x => x.name == cookingGroupName)) {
		// add a new group if it did not exist already
		assignedUsers.value.push({
			name: cookingGroupName,
			people: [{
				date: dateToAdd,
				...selectedPerson
			}]
		})
	} else {
		let currentCookingGroup = assignedUsers.value.find(x => x.name == cookingGroupName);
		// If date already exists, just change the user id and name
		if (currentCookingGroup?.people.some(x => x.date.getDate() == dateToAdd.getDate())) {
			const newAssignedUsers = assignedUsers.value.map(group => {
				if (group.name === cookingGroupName) {
					return {
						...group,
						people: group.people.map(person =>
							person.date.getDate() === dateToAdd.getDate()
								? { ...person, id: selectedPerson.id, name: selectedPerson.name }
								: person
						)
					};
				}
				return group;
			});
			assignedUsers.value = newAssignedUsers;
		} else {
			// add to group
			currentCookingGroup?.people.push({
				date: dateToAdd,
				...selectedPerson
			})
		}
	}
}

const doAutomaticOrganize = async () => {
	// Begin loading

	let body = {};
	if (cookingChooserRef.value?.selectedGroup) {
		body = {
			cookingGroups: [cookingChooserRef.value?.selectedGroup?.id]
		}
	}
	const { data: data, error: error } = await useAPI<groupAssign>(`/api/cooking/roster/${selectedMonth.value.year}/${selectedMonth.value.month}/auto`, {
		method: "POST",
		body: body
	});

	if (error.value) {
		useSonner.error(error.value!.statusMessage!);
		return;
	}

	// End loading and assignCookingPerson
	data.value!.forEach(cookingGroup => {
		cookingGroup.availabilities.forEach(availability => {
			saveCookingPerson({
				id: availability.userId,
				name: availability.userName
			}, new Date(selectedMonth.value.year, selectedMonth.value.month - 1, availability.day), cookingGroup.groupName)
		});
	});
}

const removeAssigned = () => {
	if (cookingChooserRef.value?.selectedGroup) {
		assignedUsers.value = assignedUsers.value.filter(x => x.name != cookingChooserRef.value?.selectedGroup?.name)
		return
	}

	// remove all assigned
	assignedUsers.value = [];
}

const submitAssingees = () => {
	console.log("TODO: Submit! :)")
}

</script>

<style></style>