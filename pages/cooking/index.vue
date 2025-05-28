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
			<UiCard class="w-100" title="Maar wie moeten er afwassen?">
				<template #content>
					<UiCardContent>
						<UiListbox :highlight-on-hover="false">
							<UiListboxFilter v-model="search" placeholder="Zoeken..." />
							<UiListboxContent>
								<template v-for="group in filteredGroups" :key="group.id">
									<UiListboxGroup>
										<UiListboxGroupLabel>{{ group.name }}</UiListboxGroupLabel>
										<template v-if="group.people.length > 0">
											<template v-for="p in group.people" :key="p.id">
												<UiListboxItem :value="p">
													<div class="flex items-center gap-5">
														<UiAvatar src="/img/dannyprofielfoto.png" class="size-8" />
														<div class="text-sm">
															<p class="font-medium">{{ p.name }}</p>
															<p class="text-xs text-muted-foreground">{{ p.points }}
																punten</p>
														</div>
													</div>
												</UiListboxItem>
											</template>
										</template>
										<template v-else>
											<div class="flex items-center justify-center py-5 text-sm font-medium">
												<p>Er zijn geen mensen met die naam</p>
											</div>
										</template>
									</UiListboxGroup>
								</template>
							</UiListboxContent>
						</UiListbox>
						Markeer als afwassers knop
					</UiCardContent>
				</template>
			</UiCard>
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

// Mock groups and people
type Person = { id: string, name: string, points: number }
type Group = { id: string, name: string, people: Person[] }

const groups = ref<Group[]>([
	{
		id: 'k1',
		name: 'K1',
		people: [
			{ id: '1', name: 'Danny', points: 20 },
			{ id: '2', name: 'Henkie', points: 24 },
			{ id: '3', name: 'Sanne', points: 22 },
		],
	},
	{
		id: 'k2',
		name: 'K2',
		people: [
			{ id: '4', name: 'Lisa', points: 18 },
			{ id: '5', name: 'Bram', points: 21 },
		],
	},
])

const search = ref("");
const selected = ref<Person | null>(null);

const filteredGroups = computed(() => {
	if (!search.value) return groups.value;
	return groups.value.map(group => ({
		...group,
		people: group.people.filter(p => p.name.toLowerCase().includes(search.value.toLowerCase()))
	}));
});
</script>
