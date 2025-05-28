<script setup lang="ts">
import AuthenticatedBase from './components/base/authenticated/AuthenticatedBase.vue';
import { UiToastToaster, UiVueSonner } from '#components';
import { useSessionStore } from '~/composables/useSessionStore';
const sessionStore = useSessionStore();
</script>

<template>
	<NuxtLoadingIndicator />
	<UiToastToaster></UiToastToaster>
	<UiVueSonner />
	<NuxtPage v-if="sessionStore.status !== 'authenticated'"></NuxtPage>

	<AuthenticatedBase v-if="sessionStore.status === 'authenticated'">
		<NuxtPage />
	</AuthenticatedBase>
</template>

<style>
@import url('~/assets/css/mfr.css');
</style>