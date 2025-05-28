<template>
	<div class="grid grid-cols-4 gap-4">
		<div class="col-span-2 row-span-2">
			<UiCard title="Gebruikers">
				<template #content>
					<UserTable />
				</template>
			</UiCard>
		</div>
	</div>
</template>

<script lang="ts" setup>
import UserTable from './components/base/authenticated/admin/UserTable.vue';
useSeoMeta({
	title: "Admin Dashboard",
});

</script>

<style>
/* Add custom styles for the datatable card */
</style>