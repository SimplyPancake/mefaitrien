<template>
	<div class="grid grid-cols-4 grid-rows-5 gap-4">
		<div class="col-span-3 row-span-5">
			<UiCard class="w-100" title="Vul je beschikbaarheid in">
				<template #content>
					<UiCardContent>
						<UiAlert v-if="!canfillmonth" icon="lucide:circle-alert" variant="destructive"
							icon-class="mt-0.5" description="Je kan deze maand niet invullen!" />
						<!-- <UiLoader v-if="fillmontshstatus == 'pending'" class="size-10"
							icon="svg-spinners:blocks-wave" /> -->
						<KeepAlive>
							<FullCalendar ref="calendarRef" :options="calendarOptions" />
						</KeepAlive>
					</UiCardContent>
				</template>
			</UiCard>
		</div>
		<div class="col-start-4">
			<UiCard class="w-100" title="Hoe gebruik je dit?">
				<template #content>
					<UiCardContent>
						Klik en sleep om een range aan data te selecteren. <br />
						Gebruik daarna de knoppen rechts om je data aan te passen, of druk op <UiKbd>Z</UiKbd>, <UiKbd>X
						</UiKbd>, <UiKbd>C</UiKbd> of <UiKbd>V</UiKbd>
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
								:disabled="!canfillmonth || selecteddates.length == 0">
								<Icon class="size-4" name="lucide:x" />
							</UiButton>
							<!-- Default state; ik kan WEL -->
							<UiButton class="w-full" variant="positive"
								@click="updateSelectedDatesAvailability('AVAILABLE')"
								:disabled="!canfillmonth || selecteddates.length == 0">
								<Icon class="size-4" name="lucide:check" />
							</UiButton>
							<!-- Liever niet -->
							<UiButton class="w-full" variant="caution"
								@click="updateSelectedDatesAvailability('NEGATIVE')"
								:disabled="!canfillmonth || selecteddates.length == 0">
								<Icon class="size-4" name="lucide:minus" />
							</UiButton>
							<!-- Graag -->
							<UiButton class="w-full" variant="constructive"
								@click="updateSelectedDatesAvailability('POSITIVE')"
								:disabled="!canfillmonth || selecteddates.length == 0">
								<Icon class="size-4" name="lucide:plus" />
							</UiButton>
						</div>
						<div class="flex justify-between gap-2 pt-2 border-t">
							<UiButton variant="outline" class="w-full" @click="resetAvailability"
								:disabled="!canfillmonth && !hasmadechangestothismonth">Annuleren</UiButton>
							<UiButton variant="default" class="w-full" @click="submitMonthData"
								:disabled="!canfillmonth">
								Sla deze maand op</UiButton>
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
import { AvailabilityType, type Availability, type BlockedDay, type MonthRoster } from "@prisma/client";
import { usePageInfoStore } from '~/composables/usePageInfoStore';
import { useMagicKeys } from '@vueuse/core'
import { useAPI } from '~/composables/useAPI';

usePageInfoStore().setPageInfo({
	title: 'Beschikbaarheid',
});

useSeoMeta({
	title: "Koken - Beschikbaarheid"
})

type extraStuff = {
	availabilities: Availability[],
	blockedDates: BlockedDay[]
}

type DateAvailabilityType = AvailabilityType | "BLOCKED"

type SelectedDate = {
	date: Date,
	availability: DateAvailabilityType
}

const keys = useMagicKeys()
const route = useRoute()


watchEffect(() => {
	if (keys.z.value) {
		updateSelectedDatesAvailability('UNAVAILABLE')
	} else if (keys.x.value) {
		updateSelectedDatesAvailability('AVAILABLE')
	} else if (keys.c.value) {
		updateSelectedDatesAvailability('NEGATIVE')
	} else if (keys.v.value) {
		updateSelectedDatesAvailability('POSITIVE')
	}
})

const calendarRef = ref<InstanceType<typeof FullCalendar> | null>(null);
const selecteddates = ref<Date[]>([]);

const selectedmonth = ref(new Date().getMonth())
const selectedyear = ref(new Date().getFullYear())
const canfillmonth = ref(false);
const hasmadechangestothismonth = ref(false);

// Get dates from store or initialize to empty array
const dates = ref<SelectedDate[]>([]);
// Keep backup for reset
let olddates: SelectedDate[] = [];

// Get availability of some months
const { data: tofillinmonths, error: fillmonthserror, status: fillmontshstatus, execute: getmonthdata } = await useAPI<(MonthRoster & extraStuff)[]>("/api/cooking/availability");

const getMonths = async () => {
	await getmonthdata();
	if (fillmonthserror.value) {
		useSonner.error("Kon geen maand data ophalen");
	} else {
		useSonner.success("Data opgehaald")
	}
}

const currentFillMonth = computed(() => {
	return tofillinmonths.value?.find(x => x.month == selectedmonth.value + 1 && x.year == selectedyear.value)
})

const initialiseMonth = () => {
	canfillmonth.value = false;
	dates.value = [];
	olddates = [];
	hasmadechangestothismonth.value = false;


	if (selectedyear.value < new Date().getFullYear() - 2) {
		canfillmonth.value = false;
	} else {
		// May be able to set to true
		canfillmonth.value = !!currentFillMonth.value
	}

	if (currentFillMonth.value && currentFillMonth.value?.availabilities.length != 0) {
		let m = currentFillMonth.value;
		// Set dates to include the availabilities
		currentFillMonth.value.availabilities.forEach(av => {
			dates.value.push({
				// TODO: Check index of month and day
				date: new Date(m.year, m.month - 1, av.day),
				availability: av.availability
			})
		});

		// and push blocked days
		currentFillMonth.value.blockedDates.forEach(av => {
			dates.value.push({
				// TODO: Check index of month and day
				date: new Date(m.year, m.month - 1, av.day),
				availability: "BLOCKED"
			})
		});
	} else if (canfillmonth.value) {
		// If user hasn't filled in any dates yet
		for (let date = startOfMonth.value; date.isBefore(endOfMonth.value); date = date.add(1, "day")) {
			// If date is in a date that cannot be selected, set it to gray!
			if (currentFillMonth.value?.blockedDates.some(x => x.day == date.day() + 1)) {
				dates.value.push({
					date: date.toDate(),
					availability: "BLOCKED"
				});
			} else {
				dates.value.push({
					date: date.toDate(),
					availability: "AVAILABLE"
				});
			}
		}
	}

	// set calendar selectable
	calendarRef.value?.getApi().setOption("selectable", canfillmonth.value)

	// Backup current state
	olddates = dates.value.map(d => ({ ...d }));
}

onMounted(() => {
	const now = new Date()
	const params = route.params.params as string[] | undefined

	if (params) {
		const yearParam = params?.[0]
		const monthParam = params?.[1]

		const year = parseInt(yearParam ?? '')
		const month = parseInt(monthParam ?? '')

		selectedyear.value = !isNaN(year) ? year : now.getFullYear()
		selectedmonth.value = !isNaN(month) ? month - 1 : now.getMonth()
		calendarRef.value?.getApi().gotoDate(startOfMonth.value.toDate());
	}

	getMonths();
	initialiseMonth();
});


const resetAvailability = () => {
	dates.value = olddates.map(d => ({ ...d })); // deep clone!
	selecteddates.value = []; // clear selection
};

const updateSelectedDatesAvailability = (availability: AvailabilityType) => {
	hasmadechangestothismonth.value = true;

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
	calendarRef.value?.getApi().unselect();
};

// Get month range
const startOfMonth = computed(() => {
	return dayjs().set("month", selectedmonth.value).set("year", selectedyear.value).startOf("month");
})

const endOfMonth = computed(() => {
	return dayjs().set("month", selectedmonth.value).set("year", selectedyear.value).endOf("month");
})

const getColorForAvailability = (availability?: DateAvailabilityType) => {
	switch (availability) {
		case 'UNAVAILABLE':
			return '#fca5a5'; // light red
		case 'AVAILABLE':
			return '#6ee7b7'; // pastel green
		case 'POSITIVE':
			return '#93c5fd'; // light blue
		case 'NEGATIVE':
			return '#fde68a'; // soft yellow
		case "BLOCKED":
			return '#e5e7eb' // light gray
		default:
			return '#e5e7eb'; // light gray
	}
};

const getAvailableEventsForMonth = computed(() => {
	const events: any[] = [];

	for (let date = dayjs(startOfMonth.value); date.isBefore(endOfMonth.value); date = date.add(1, "day")) {
		const dateStr = date.format("YYYY-MM-DD");
		const existingDate = dates.value.find(d => dayjs(d.date).format("YYYY-MM-DD") === dateStr);

		if (existingDate) {
			events.push({
				start: dateStr,
				display: "background",
				backgroundColor: getColorForAvailability(existingDate.availability),
				allDay: true,
				overlap: existingDate.availability == "BLOCKED"
			});
		}
	}

	return events;
});

// Dynamically update calendar events when availability changes
watch(getAvailableEventsForMonth, (newEvents) => {
	calendarOptions.value.events = newEvents;

	// Refresh events in calendar manually
	const calendarApi = calendarRef.value?.getApi();
	if (calendarApi) {
		calendarApi.removeAllEvents();
		calendarApi.addEventSource(newEvents);
	}
});

watch(selectedmonth, () => {
	initialiseMonth();
})

// TODO: selectConstraint to make the user not be able to
// select dates that have been marked as unneeded
// eventOverlap!
const calendarOptions = ref<CalendarOptions>({
	locale: "nl",
	plugins: [dayGridPlugin, interactionPlugin],
	initialView: "dayGridMonth",
	// weekends: false,
	firstDay: 1,
	stickyHeaderDates: true,
	editable: false,
	headerToolbar: {
		left: "title",
		center: "",
		right: "gotoprev,gotonext",
	},
	selectable: true,
	buttonIcons: {
		gotoprev: 'chevron-left',
		gotonext: 'chevron-right',
	},
	customButtons: {
		gotoprev: {
			// TODO: Want to save availability? Changing months will remov
			text: '<',
			click: function () {
				selectedmonth.value = selectedmonth.value - 1;

				if (selectedmonth.value < 0) {
					selectedmonth.value = selectedmonth.value + 12;
					selectedyear.value = selectedyear.value - 1;
				}

				calendarRef.value?.getApi().prev();
			}
		},
		gotonext: {
			text: '>',
			click: function () {
				selectedmonth.value = selectedmonth.value + 1;

				if (selectedmonth.value > 11) {
					selectedmonth.value = selectedmonth.value % 12;
					selectedyear.value = selectedyear.value + 1;
				}

				calendarRef.value?.getApi().next();
			}
		}
	},
	selectOverlap: (event) => {
		if (event) {
			if (event.start?.getMonth() != selectedmonth.value) {
				return false;
			}

			return !currentFillMonth.value?.blockedDates.some(x => x.day == event?.start?.getDate())
		}
		return false;
	},
	events: () => getAvailableEventsForMonth.value,
	select(info) {
		selecteddates.value = [];
		let startDate = new Date(info.start);

		while (startDate < info.end) {
			selecteddates.value.push(new Date(startDate));
			startDate.setDate(startDate.getDate() + 1);
		}
	}
});


async function submitMonthData() {
	try {
		const $fetch = useNuxtApp().$api;
		await $fetch('/api/cooking/availability', {
			method: 'POST',
			body: {
				year: selectedyear.value,
				month: selectedmonth.value,
				dates: dates.value.filter(x => x.availability != "BLOCKED"),
			},
		});

		useSonner.success("Maand opgeslagen!");
		olddates = dates.value.map(d => ({ ...d }));
	} catch (error: any) {
		useSonner.error(error.message);
	}
}

</script>
