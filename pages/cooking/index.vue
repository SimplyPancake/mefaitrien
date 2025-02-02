<template>
	<div class="flex flex-row">
		<div class="basis-1/2 gap-4">
			<UiCard class="w-100" title="Je beschikbaarheid voor deze maand">
				<template #content>
					<UiCardContent>
						<UiCalendar :attributes="attributes" borderless expanded :first-day-of-week="2" locale="nl"
							:masks="{ weekdays: 'WW' }" />
					</UiCardContent>
				</template>
			</UiCard>
		</div>
		<div class="basis-1/2">Twee verticale overzichten, volgende maand & nog wat. We gebruiken verder FullCalendar
			voor het invullen</div>
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