<template>
	<UiCard v-if="props.card" class="w-100" :title="props.title">
		<template #content>
			<UiCardContent>
				<div class="grid grid-rows-1 grid-cols-3 gap-4">
					<div class="col-span-2">
						<UiCalendar ref="calendarRef" borderless :first-day-of-week="2" locale="nl"
							:masks="{ weekdays: 'WW' }" title-position="left" v-on:update:pages="updateMonth" expanded>
							<slot></slot>
						</UiCalendar>
					</div>
				</div>
			</UiCardContent>
		</template>
	</UiCard>
	<template v-else>
		<UiCalendar ref="calendarRef" borderless :first-day-of-week="2" locale="nl" :masks="{ weekdays: 'WW' }"
			title-position="left" v-on:update:pages="updateMonth" expanded>
			<slot></slot>
		</UiCalendar>
	</template>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import dayjs from 'dayjs';
import type Calendar from '~/components/Ui/Calendar.vue';

const calendarRef = ref<InstanceType<typeof Calendar> | null>(null);

const selectedmonth = ref<number>(dayjs().month());
const selectedyear = ref<number>(dayjs().year());

const props = withDefaults(defineProps<{
	card?: boolean
	title?: string
}>(), {
	card: false,
	title: "Kies een maand"
})

defineExpose({
	selectedmonth,
	selectedyear
})

const updateMonth = (e: any[]) => {
	const page = e[0];
	selectedmonth.value = page.month;
	selectedyear.value = page.year;
};
</script>

<style scoped></style>
