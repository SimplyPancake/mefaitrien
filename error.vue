<template>
	<AuthenticatedBase v-if="sessionStore.status == 'authenticated'">
		<UiError v-bind="error" />
	</AuthenticatedBase>
</template>

<script setup lang="ts">
import { UiError } from '#components';
const error = useError();
import { useSessionStore } from '~/composables/useSessionStore';
const sessionStore = useSessionStore();

</script>

<style scoped></style>