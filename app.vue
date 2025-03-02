<script setup lang="ts">
import AuthenticatedBase from './components/base/authenticated/AuthenticatedBase.vue';
import { UiToastToaster, UiVueSonner } from '#components';
const { status } = useAuth()

// Global css mfr.css
</script>

<template>
	<NuxtLoadingIndicator />
	<UiToastToaster></UiToastToaster>
	<UiVueSonner />
	<NuxtPage v-if="status != 'authenticated'"></NuxtPage>

	<AuthenticatedBase v-if="status == 'authenticated'">
		<NuxtPage />
	</AuthenticatedBase>
</template>

<style>
@import url('~/assets/css/mfr.css');
</style>