<script setup lang="ts">
import AuthenticatedBase from './components/base/authenticated/AuthenticatedBase.vue';
import { UiToastToaster, UiVueSonner } from '#components';
import { useSessionStore } from '~/composables/useSessionStore';
import { Role } from '~/generated/prisma/browser';
const sessionStore = useSessionStore();

// Feut members get the Comic Sans theme, see assets/css/feut.css
const isFeut = computed(() => sessionStore.sessionData?.roles?.includes(Role.FEUT) ?? false);

useHead(() => ({
	htmlAttrs: { "data-feut": isFeut.value ? "" : undefined },
}));
</script>

<template>
	<NuxtLoadingIndicator />
	<UiToastToaster></UiToastToaster>
	<UiVueSonner class="animate-fadeIn" />
	<NuxtPage v-if="sessionStore.status !== 'authenticated'"></NuxtPage>

	<AuthenticatedBase v-if="sessionStore.status === 'authenticated'">
		<NuxtPage />
	</AuthenticatedBase>
</template>

<style>
@import url('~/assets/css/mfr.css');
@import url('~/assets/css/feut.css');
</style>