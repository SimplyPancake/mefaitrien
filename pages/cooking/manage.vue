<template>
	<!-- Manage cooking rosters (CRUD per year) -->
	<!-- View users who haven't filled in for this and/or upcoming month -->
	<div class="grid grid-cols-3 grid-rows-6 gap-4">
		<div class="row-span-2">
			<UiCard title="Kies een maand">
				<template #content>
					<UiCardContent>
						<UiMonthChooser ref="monthchooser" />
					</UiCardContent>
				</template>
			</UiCard>
		</div>
		<div class="col-span-2 row-span-2">
			<UiCard title="Maand informatie">
				<template #content>
					<UiCardContent>
						<UiDescriptionList>
							<template v-for="item in items" :key="item.term">
								<UiDescriptionListTerm>{{ item.term }}</UiDescriptionListTerm>
								<UiDescriptionListDetails>{{ item.details }}</UiDescriptionListDetails>
							</template>
						</UiDescriptionList>

						<!-- Maand al ingedeeld: -->
						<!-- Verander indeling -->

						<!-- Maand nog niet ingedeeld maar wel ingevuld -->
						<!-- Deel in -->

						<!-- Maand bestaat nog niet -->
						<!-- Link naar aanmaken OF doe het hier. Maakt voor nu nog niet uit. -->
					</UiCardContent>
				</template>
			</UiCard>
		</div>
		<div class="col-span-2 row-span-5 row-start-3">
			<UiCard title="Creeer of wijzig maand">
				<template #content>
					<UiCardContent>
						<BaseAuthenticatedCookingPlannercontrols ref="cookingChooser" />
						<FullCalendar></FullCalendar>
						Hier komt de maand
						Dropdown met kookgroep en selectiemanier voor 'zelf indelen' of 'automatisch indeling'
						daarna moet mogelijk zijn om te wijzigen
						{{ cookingChooserRef?.useAutomatic }}
					</UiCardContent>
				</template>
			</UiCard>
		</div>
		<div class="row-span-5 col-start-3 row-start-3">
			<UiCard title="Maar hoe vaak koken ze dan?">
				<template #content>
					<UiCardContent>
						Kies een groep eerst ofzo

						Als we een NIEUWE maand aan het indelen zijn, dan laten we zien hoeveel kookpunten mensen er bij
						krijgen (dus bijv. 47 + 2)
						Als je een oude maand bekijkt (of al ingedeelde) dan laten we alleen zien hoevaak ze hebben
						gekookt
					</UiCardContent>
				</template>
			</UiCard>
		</div>
	</div>
</template>

<script lang="ts" setup>
import { useTemplateRef, ref } from 'vue';
import { UiMonthChooser } from '#components';
import { BaseAuthenticatedCookingPlannercontrols } from '#components';
import type { MonthRoster, Availability, BlockedDay } from "@prisma/client"

type ChooserType = InstanceType<typeof UiMonthChooser>
type CookingChooserType = InstanceType<typeof BaseAuthenticatedCookingPlannercontrols>;

const chooserref = useTemplateRef<ChooserType>('monthchooser')
const cookingChooserRef = useTemplateRef<CookingChooserType>('cookingChooser')

const items = computed(() => {
	if (selectedMonth.value) {
		return [
			{ term: "Maand type", details: selectedMonth.value.status },
			{ term: "Mensen ingevuld", details: "13/15" },
			{ term: "Laatste wijziging", details: "8 juni 2025, 11:42" },
			{ term: "Dagen zonder beschikbare kok", details: "Geen" },
			{ term: "Gemiddelde beschikbaarheid", details: "63%" },
		]
	}

	return [
		{ term: "Maand type", details: "Nog aan te maken" },
		{ term: "Mensen ingevuld", details: "n.v.t." },
		{ term: "Laatste wijziging", details: "n.v.t." },
		{ term: "Dagen zonder beschikbare kok", details: "n.v.t." },
		{ term: "Gemiddelde beschikbaarheid", details: "n.v.t." },
	]
})

type FullMonth = MonthRoster & {
	availabilities: Availability[],
	blockedDates: BlockedDay[]
}

const { data: createdmonths, error: createdmonthserror } = await useAPI<FullMonth[]>('/api/cooking/roster/months');
if (createdmonthserror.value) {
	console.log(createdmonthserror.value)
	useSonner.error("Kon oude maanden niet ophalen!")
}

const selectedMonth = computed(() => {
	return createdmonths.value?.find(x => x.year == chooserref.value?.selectedyear && x.month == chooserref.value.selectedmonth)
})

const emptyMonth = computed(() => {
	return !selectedMonth.value
})

</script>

<style></style>