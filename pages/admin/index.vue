<template>
	<div class="grid grid-cols-2 gap-4">
		<BaseStatisticBar></BaseStatisticBar>
		<BaseStatisticBar></BaseStatisticBar>
		<BaseStatisticBar></BaseStatisticBar>
		<BaseStatisticBar></BaseStatisticBar>
	</div>
</template>

<script lang="ts" setup>
import { BaseStatisticBar } from '#components';

useSeoMeta({
	title: "Admin Dashboard"
})

</script>

<style></style>