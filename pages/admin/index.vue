<template>
	<div class="grid grid-cols-4 gap-4">
		<div class="col-span-2 row-span-2">
			<UiCard title="Gebruikers">
				<template #content>
					<BaseAuthenticatedAdminUserTable />
				</template>
			</UiCard>
		</div>
		<NuxtLink
			to="/admin/absences"
			class="flex items-center gap-3 rounded-xl border bg-card p-5 shadow-sm transition-colors hover:bg-accent"
		>
			<Icon name="lucide:calendar-off" class="size-6 text-primary" />
			<span>
				<span class="block font-semibold">Afwezigheden</span>
				<span class="text-sm text-muted-foreground">Beheer afwezigheidsperiodes</span>
			</span>
		</NuxtLink>
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