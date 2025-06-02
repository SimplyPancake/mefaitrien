ale<template>
	<div class="grid grid-cols-4 grid-rows-5 gap-4">
		<div class="row-span-4">
			<UiCard class="w-100">
				<template #content>
					<UiCardContent>
						<UiStepper v-model="stepper" orientation="vertical"
							class="mx-auto flex w-full max-w-md flex-col justify-start gap-10">
							<UiStepperItem v-for="step in steps" :key="step.step" v-slot="{ state }"
								class="group relative flex w-full items-start gap-6" :step="step.step">
								<UiStepperSeparator v-if="step.step != steps[steps.length - 1].step"
									class="absolute left-[18px] top-[38px] block h-[105%] w-0.5 shrink-0 rounded-full bg-muted group-data-[state=completed]:bg-primary" />
								<UiStepperTrigger as-child>
									<UiButton
										:variant="state == 'completed' || state == 'active' ? 'default' : 'outline'"
										size="icon" class="z-10 shrink-0 rounded-full"
										:class="[state == 'active' && 'ring-2 ring-ring ring-offset-2 ring-offset-background']">
										<TransitionScale mode="out-in" :scale="0.8">
											<Icon v-if="state == 'completed'" name="lucide:check" class="size-5" />
											<Icon v-if="state == 'active'" name="lucide:circle" class="size-5" />
											<Icon v-if="state == 'inactive'" name="lucide:dot" class="size-10" />
										</TransitionScale>
									</UiButton>
								</UiStepperTrigger>

								<div class="flex flex-col gap-1">
									<UiStepperTitle :class="[state == 'active' && 'text-primary']"
										class="text-sm font-semibold transition lg:text-base">{{ step.title }}
									</UiStepperTitle>
									<UiStepperDescription :class="[state == 'active' && 'text-primary']"
										class="text-xs text-muted-foreground transition lg:text-sm">{{ step.description
										}}</UiStepperDescription>
								</div>
							</UiStepperItem>
						</UiStepper>
					</UiCardContent>
				</template>
			</UiCard>
		</div>
		<div class="col-span-2 row-span-4">
			<UiCard class="w-100" :title="stepper == 1 ? 'Kies een maand' : (`Pas
				${months[selectedmonth]} aan`)">
				<template #content>
					<UiCardContent>
						<div class="grid grid-rows-1 grid-cols-3 gap-4">
							<div class="col-span-2">
								<UiCalendar ref="calendar1" borderless :attributes="attributes" :first-day-of-week="2"
									locale="nl" :masks="{ weekdays: 'WW' }" title-position="left"
									v-on:update:pages="updateMonth" v-on:dayclick="clickDay" expanded>
									<template #footer>
										<div class="flex flex-row gap-4">
											<UiButton
												v-if="(stepper == 3 || stepper == 2) && !selectedMonthAlreadyCreated"
												icon-placement="right" type="button" @click="goBack" class="w-full"
												variant="linkHover1">
												Ik weet het nog niet zeker
											</UiButton>
											<UiButton v-if="stepper == 3 && !selectedMonthAlreadyCreated"
												icon-placement="right" type="button" class="w-full"
												@click="createMonth">
												Maak definitief aan
											</UiButton>
											<UiButton v-if="stepper != 3 && !selectedMonthAlreadyCreated"
												icon-placement="right" type="button" @click="goToNext" class="w-full">
												<Icon class="size-4" name="lucide:calendar-check-2" />{{ stepper == 1 ?
													"Kies maand" : (stepper == 2 ? "Maak selectie definitief" :
														"Stuur naar server") }}
											</UiButton>
											<UiButton v-if="stepper != 3 && selectedMonthAlreadyCreated"
												icon-placement="right" type="button" @click="" variant="ghost"
												class="w-full">
												Deze maand is al aangemaakt.
											</UiButton>
										</div>
									</template>
								</UiCalendar>
							</div>
							<div class="col-span-1">
								<p v-if="stepper == 2" class="pb-2">
									Klik op een datum om de staat van de datum te toggelen. Grijs betekent dat de datum
									niet
									kan worden ingevuld.
								</p>
								<p v-if="isOnWrongSelectedMonth" class="font-bold">
									Je zit op de verkeerde maand! Je zit op {{ months[calendarselectedmonth - 1] }},
									maar je
									hebt {{
										months[selectedmonth - 1] }} gekozen!
								</p>
							</div>
						</div>
					</UiCardContent>
				</template>
			</UiCard>
		</div>
	</div>
</template>

<script lang="ts" setup>
import dayjs from "dayjs";
import type Calendar from "~/components/Ui/Calendar.vue";
import type { CreatedRosterMonth } from "~/types/dto";

usePageInfoStore().setPageInfo({
	title: 'Kookmaand aanmaken',
});

useSeoMeta({
	title: "Kookmaand aanmaken"
})

// Get already created months
const { data: createdmonths, error: createdmonthserror } = await useAPI<CreatedRosterMonth[]>('/api/cooking/roster/months');
if (createdmonthserror.value) {
	console.log(createdmonthserror.value)
	useSonner.error("Kon oude maanden niet ophalen!")
}


// Get weekends of selected month!
function getWeekendDaysCalendar(year: number, month: number) {
	const weekends = [];
	const objs: any[] = [];
	const daysInMonth = dayjs(`${year}-${month}-01`).daysInMonth();

	for (let day = 1; day <= daysInMonth; day++) {
		const date = dayjs(`${year}-${month}-${day}`);
		const dayOfWeek = date.day(); // Sunday = 0, Saturday = 6

		if (dayOfWeek == 0 || dayOfWeek == 6 || dayOfWeek == 5) {
			weekends.push(date.toString()); // Push the dayjs object directly
		}
	}

	// Then for each weekend push an object
	weekends.forEach(weekendDay => {
		objs.push({
			dates: weekendDay,
			bar: "gray",
		})
	});

	return objs;
}

const months = ["januari", "februari", "maart", "april", "mei", "juni", "juli", "augustus", "september", "oktober", "november", "december"];
// stomme calendar heeft geen typing export grrr
interface CalendarPage {
	month: number;
	year: number;
}

// Now generate all values in calendar initially for selected month
const calendar1 = ref<InstanceType<typeof Calendar> | null>(null);

const selectedmonth = ref(dayjs().month()) // 0 is january
const selectedyear = ref(dayjs().year())
const calendarselectedmonth = ref(dayjs().month())

const selectedMonthAlreadyCreated = computed(() => {
	return createdmonths.value?.some(x => x.year == selectedyear.value && x.month == selectedmonth.value)
})

const updateMonth = (e: CalendarPage[]) => {
	let page = e[0];
	calendarselectedmonth.value = page.month;
	if (stepper.value == 1) {
		// Januari = 1
		selectedmonth.value = page.month;
		selectedyear.value = page.year;
	}
}

const isOnWrongSelectedMonth = computed(() => {
	return selectedmonth.value != calendarselectedmonth.value
})

// TODO: Filter for only people that have the role
// Get cooking roster for the next month to fill in
const stepper = ref(1);
const steps = [
	{
		step: 1,
		title: "Aanmaken",
		description: "Kies een maand om een kookrooster voor aan te maken",
	},
	{
		step: 2,
		title: "Selecteer dagen dat er niet wordt gegeten",
		description: "Gebruik je selectie tools om het kookrooster in te delen",
	},
	{
		step: 3,
		title: "Ready?",
		description: "Controleer je gegevens en maak het definitief aan",
	},
];

const attributes = ref<any[]>([])

const goToNext = () => {
	if (stepper.value == 2) {
		stepper.value = 3;
	}

	if (stepper.value == 1) {

		stepper.value = 2

		let days = getWeekendDaysCalendar(selectedyear.value, selectedmonth.value);
		attributes.value = days;
	}
}

const goBack = () => {
	stepper.value = stepper.value - 1;
	if (stepper.value == 1) {
		attributes.value = [];
	}
}

const clickDay = (day: any, event: any) => {
	if (stepper.value !== 2) return;

	const clickedDate = dayjs(day.date).toISOString();

	// Find index of date in attributes
	const index = attributes.value.findIndex((attr: any) =>
		dayjs(attr.dates).toISOString() === clickedDate
	);

	if (index !== -1) {
		// Date already exists: remove it
		attributes.value.splice(index, 1);
	} else {
		// Add it
		attributes.value.push({
			dates: clickedDate,
			bar: "gray",
		});
	}
};

const createMonth = async () => {
	let blockedDates: string[] = []
	blockedDates = attributes.value.map(x => x.dates)

	// Then send the dates with POST
	const { data, error } = await useAPI('/api/cooking/roster/create', {
		method: "POST",
		body: {
			dates: blockedDates,
			month: selectedmonth.value,
			year: selectedyear.value
		}
	});

	if (error.value) {
		useSonner.error(error.value.message);
	} else {
		// success!
		useSonner.success("Aanmaken gelukt!")
	}
}

</script>

<style></style>