<template>
	<div class="grid grid-cols-4 gap-4">
		<div class="col-span-2 row-span-2">
			<UiCard title="Gebruikers">
				<template #content>
					<BaseAuthenticatedAdminUserTable />
				</template>
			</UiCard>
		</div>
	</div>
</template>

<script lang="ts" setup>
useSeoMeta({
	title: "Admin Dashboard",
});

</script>

<style>
/* Add custom styles for the datatable card */
</style>