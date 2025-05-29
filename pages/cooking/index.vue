<template>
	<div class="grid grid-cols-4 gap-4">
		<div class="col-span-1 row-span-2">
			<UiCard class="w-100" title="Je beschikbaarheid">
				<template #content>
					<UiCardContent>
						<UiCalendar :attributes="attributes" borderless expanded :first-day-of-week="2" locale="nl"
							:masks="{ weekdays: 'WW' }" title-position="right" />
					</UiCardContent>
				</template>
			</UiCard>
		</div>
		<div class="col-span-1 row-span-1">
		</div>
	</div>
</template>

<script setup lang="ts">
import { UiCalendar } from '#components';
import type { MonthRoster } from "@prisma/client"
import { ref, computed } from 'vue';
import { addDays, endOfMonth, startOfMonth, startOfToday } from "date-fns";
import { usePageInfoStore } from '~/composables/usePageInfoStore';
usePageInfoStore().setPageInfo({
	title: 'Koken',
});

useSeoMeta({
	title: "Koken Dashboard"
})

let currentYear = new Date().getFullYear()
let currentMonth = new Date().getMonth() + 1

const { data: currentMonthRoster } = await useAPI<MonthRoster>("/api/cooking")

let dateFormatter = new Intl.DateTimeFormat('nl', { month: 'long' })
let nextMonthDate = new Date()
nextMonthDate.setMonth(nextMonthDate.getMonth() + 1)
let nextMonthName = dateFormatter.format(nextMonthDate)

const attributes = ref([
	{
		bar: "green",
		popover: {
			label: "Beschikbaar"
		},
		dates: addDays(startOfMonth(startOfToday()), 8).toString()
	},
	{
		bar: "red",
		popover: {
			label: "Niet beschikbaar"
		},
		dates: addDays(startOfMonth(startOfToday()), 2).toString()
	}
])
</script>
