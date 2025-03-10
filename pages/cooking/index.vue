<template>
	<p class="text-2xl text-foreground font-bold">Koken overzicht</p>

	<div class="flex flex-row gap-4">
		<div class="basis-1/2">
			<UiCard class="w-100" title="Je beschikbaarheid voor deze maand">
				<template #content>
					<UiCardContent>
						<UiCalendar :attributes="attributes" borderless expanded :first-day-of-week="2" locale="nl"
							:masks="{ weekdays: 'WW' }" />
					</UiCardContent>
				</template>
			</UiCard>
		</div>
		<div class="basis-1/4">
			<template v-if="nextMonthRoster != null">
				<UiCard class="w-100" :title="`Je kunt het kookrooster voor ${nextMonthName} invullen!`">
					<template #content>
						<UiCardContent>
							<UiButton variant="expandIcon" icon-placement="right" icon="lucide:hand-platter">Invullen
							</UiButton>
						</UiCardContent>
					</template>
				</UiCard>
			</template>
			<template v-else-if="currentMonthRoster">
				<UiCard class="w-100" title="Je kunt het kookrooster voor deze maand invullen!">
					<template #content>
						<UiCardContent>
							<UiButton variant="expandIcon" icon-placement="right" icon="lucide:hand-platter">Invullen
							</UiButton>
						</UiCardContent>
					</template>
				</UiCard>
			</template>
			<template v-else>
				<UiCard class="w-100" title="Er is nog geen kookrooster voor deze maand!">
					<template #content>
						<UiCardContent>
							Hier is een plaatje van onze kookheld
						</UiCardContent>
					</template>
				</UiCard>
			</template>
		</div>
	</div>
	<!-- Ingevulde beschikbaarheid van deze maand en volgende maand -->
	<!-- Beschikbaarheid invullen -->
	<!-- Kookgroep zien -->

</template>

<script setup lang="ts">
import { UiCalendar } from '#components';
import type { MonthRoster, Availability } from "@prisma/client"

useSeoMeta({
	title: "Koken Dashboard"
})

let currentYear = new Date().getFullYear()
let currentMonth = new Date().getMonth() + 1

const { data: currentMonthRoster } = await useAPI<MonthRoster>("/api/cooking")
const { data: nextMonthRoster } = await useAPI<MonthRoster>(`/api/cooking/roster/${currentYear}/${currentMonth}`)

let dateFormatter = new Intl.DateTimeFormat('nl', { month: 'long' })
let nextMonthDate = new Date()
nextMonthDate.setMonth(nextMonthDate.getMonth() + 1)
let nextMonthName = dateFormatter.format(nextMonthDate)

const attributes = ref([{}])
</script>