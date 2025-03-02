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
			<UiCard class="w-100" title="Je kunt het kookrooster voor maart invullen!">
				<template #content>
					<UiCardContent>
						<UiButton variant="expandIcon" icon-placement="right" icon="lucide:hand-platter">Invullen
						</UiButton>
					</UiCardContent>
				</template>
			</UiCard>
		</div>
	</div>
	<!-- Ingevulde beschikbaarheid van deze maand en volgende maand -->
	<!-- Beschikbaarheid invullen -->
	<!-- Kookgroep zien -->

</template>

<script setup lang="ts">
import { UiCalendar } from '#components';

useSeoMeta({
	title: "Koken Dashboard"
})

const attributes = ref([{}])
</script>