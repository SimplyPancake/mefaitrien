<template>
	<UiError v-bind="error" />
</template>

<script setup lang="ts">
import { UiError } from '#components';
const error = useError();

</script>

<style scoped>

</style>