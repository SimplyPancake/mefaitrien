<template>
  <div ref="calendarElement" />
</template>

<script setup lang="ts">
import { Calendar, type CalendarOptions } from "@fullcalendar/core";

const props = defineProps<{
  options: CalendarOptions;
}>();

const calendarElement = ref<HTMLElement | null>(null);
let calendarApi: Calendar | undefined;

onMounted(() => {
  if (!calendarElement.value) {
    return;
  }

  calendarApi = new Calendar(calendarElement.value, props.options);
  calendarApi.render();
});

watch(
  () => props.options,
  (options) => calendarApi?.resetOptions(options)
);

onBeforeUnmount(() => {
  calendarApi?.destroy();
  calendarApi = undefined;
});

defineExpose({
  getApi: () => calendarApi,
});
</script>
