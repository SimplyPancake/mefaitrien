<template>
	<SideBar>
		<slot />
		<div
			class="absolute inset-0 -z-10 h-full w-full bg-semiwhite bg-[radial-gradient(#5a5c8c,transparent_1px)] [background-size:16px_16px]">
			<div
				class="absolute bottom-0 left-0 right-0 top-0 bg-[radial-gradient(circle_800px_at_100%_200px,#f2845cbb,transparent)]">
			</div>
		</div>
	</SideBar>
</template>

<script setup lang="ts">
import SideBar from './SideBar.vue';
</script>

<style scoped></style>