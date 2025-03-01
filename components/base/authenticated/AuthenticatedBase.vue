<template>
	<SideBar>
		<slot />
		<div class="absolute inset-0 -z-10 h-full w-full bg-background"></div>
	</SideBar>
</template>

<script setup lang="ts">
import SideBar from './SideBar.vue';
</script>

<style scoped></style>