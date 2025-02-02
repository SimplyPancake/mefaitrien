<script setup lang="ts">
import AuthenticatedBase from './components/base/authenticated/AuthenticatedBase.vue';
import { UiToastToaster, UiVueSonner } from '#components';
const { status, data } = useAuth()
</script>

<template>
	<AuthenticatedBase v-if="status == 'authenticated'"></AuthenticatedBase>
	<NuxtPage></NuxtPage>
	<NuxtLoadingIndicator />
	<UiToastToaster></UiToastToaster>
	<UiVueSonner />
</template>
