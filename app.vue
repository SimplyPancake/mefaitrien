<script setup lang="ts">
import AuthenticatedBase from './components/base/authenticated/AuthenticatedBase.vue';
import SideBar from './components/base/SideBar.vue';
const { status } = useAuth()
</script>

<template>
	<div v-if="status == 'authenticated'">
		<AuthenticatedBase></AuthenticatedBase>
	</div>
	<div v-else>
		<NuxtPage></NuxtPage>
	</div>
</template>
