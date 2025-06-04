<template>
	<div class="grid grid-cols-4 grid-rows-5 gap-4">
		<div class="col-span-3 row-span-5">
			<UiCard class="w-100" title="Vul je beschikbaarheid in">
				<template #content>
					<UiCardContent>
						<UiAlert v-if="!canfillmonth" icon="lucide:circle-alert" variant="destructive"
							icon-class="mt-0.5" description="Je kan deze maand niet invullen!" />
						<UiLoader v-if="fillmontshstatus == 'pending'" class="size-10"
							icon="svg-spinners:blocks-wave" />
						<keep-alive>
							<FullCalendar v-if="fillmontshstatus == 'success'" ref="calendarRef"
								:options="calendarOptions" />
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
								:disabled="!canfillmonth">Annuleren</UiButton>
							<UiButton variant="default" class="w-full" @click="submitData" :disabled="!canfillmonth">
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
import { useCookingStore } from '~/composables/useCookingStore';
import { useMagicKeys } from '@vueuse/core'
import { useAPI } from '~/composables/useAPI';

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

const keys = useMagicKeys()

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
const cookingStore = useCookingStore();
const selecteddates = ref<Date[]>([]);

const selectedmonth = ref(new Date().getMonth())
const selectedyear = ref(new Date().getFullYear())
const canfillmonth = ref(false);

// Get dates from store or initialize to empty array
const dates = ref<SelectedDate[]>([]);
// Keep backup for reset
let olddates: SelectedDate[] = [];

type extraStuff = {
	availabilities: Availability[],
	blockedDates: BlockedDay[]
}

// Get availability of some months
const { data: tofillinmonths, error: fillmonthserror, status: fillmontshstatus } = await useAPI<(MonthRoster & extraStuff)[]>("/api/cooking/availability");

if (fillmonthserror.value) {
	useSonner.error("Kon geen maand data ophalen");
} else {
	useSonner.success("Data opgehaald")
	console.log(tofillinmonths.value)
}

const currentFillMonth = computed(() => {
	return tofillinmonths.value?.find(x => x.month == selectedmonth.value + 1 && x.year == selectedyear.value)
})

watch(selectedmonth, () => {
	initialiseMonth();
})

const initialiseMonth = () => {
	canfillmonth.value = false;

	if (selectedyear.value < new Date().getFullYear() - 2) {
		canfillmonth.value = false;
	} else {
		// May be able to set to true
		canfillmonth.value = !!currentFillMonth.value
	}

	if (currentFillMonth.value && currentFillMonth.value?.availabilities.length != 0) {
		console.log('Huidige maand is al ingevuld')
		let m = currentFillMonth.value;
		// Set dates to include the availabilities
		currentFillMonth.value.availabilities.forEach(av => {
			dates.value.push({
				// TODO: Check index of month and day
				date: new Date(m.year, m.month, av.day),
				availability: av.availability
			})
		});
	} else if (canfillmonth.value) {
		// If user hasn't filled in any dates yet
		console.log('Huidige maand is nog niet ingevuld')

		for (let date = startOfMonth.value; date.isBefore(endOfMonth.value); date = date.add(1, "day")) {
			if (date.day() === 0 || date.day() === 6) continue;

			dates.value.push({
				date: date.toDate(),
				availability: "AVAILABLE"
			});
		}
	}

	// set calendar selectable
	calendarRef.value?.getApi().setOption("selectable", canfillmonth.value)

	// Backup current state
	olddates = dates.value.map(d => ({ ...d }));
	cookingStore.setAvailability(dates.value); // Store the initialized availability
}

onMounted(() => {
	initialiseMonth();
});


const resetAvailability = () => {
	dates.value = olddates.map(d => ({ ...d })); // deep clone!
	selecteddates.value = []; // clear selection
};

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
	calendarRef.value?.getApi().unselect();
};

// Get month range
const startOfMonth = computed(() => {
	return dayjs().set("month", selectedmonth.value).set("year", selectedyear.value).startOf("month");
})

const endOfMonth = computed(() => {
	return dayjs().set("month", selectedmonth.value).set("year", selectedyear.value).endOf("month");
})

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

const getAvailableEventsForMonth = computed(() => {
	const events: any[] = [];

	for (let date = dayjs(startOfMonth.value); date.isBefore(endOfMonth.value); date = date.add(1, "day")) {
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


// TODO: selectConstraint to make the user not be able to
// select dates that have been marked as unneeded
// eventOverlap!
const calendarOptions = ref<CalendarOptions>({
	locale: "nl",
	plugins: [dayGridPlugin, interactionPlugin],
	initialView: "dayGridMonth",
	weekends: false,
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
	// selectConstraint: {
	// 	start: startOfMonth.toDate(),
	// 	end: endOfMonth.toDate(),
	// 	// Prevent selecting blocked days
	// 	constraint: (date) => {
	// 		const dateStr = dayjs(date).format("YYYY-MM-DD");
	// 		return !blockedDates.some(blocked => dayjs().date(blocked.day).format("YYYY-MM-DD") === dateStr);
	// 	},
	// },
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

const submitData = async () => {
	const { data, error } = await useAPI('/api/cooking/availability', {
		method: 'POST',
		body: dates,
	});
}

</script>
