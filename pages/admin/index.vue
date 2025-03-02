<template>
	<div class="flex flex-row gap-4">
		<div class="basis-1/2">
			<UiDatatable v-if="data" :data="tableData" :options="options" />
		</div>
	</div>
</template>

<script lang="ts" setup>
useSeoMeta({
	title: "Admin Dashboard"
})
import type { Config } from "datatables.net";
import type { CookingGroup, User } from "@prisma/client"

let tableData = []
const { data, status } = await useAPI<User[]>("/api/admin/users")
tableData = data.value ?? []

const options: Config = {
	ordering: false,
	columns: [
		{ title: "ID", data: "id", visible: false },
		{ title: "Name", data: "name" },
		{ title: "Gebruikersnaam", data: "username" },
		{ title: "Email", data: "email" },
		{ title: "Rol", data: "role" },
		{
			title: "Kookgroep",
			data: "cookingGroup",
			render: (data: CookingGroup) => data != null ? data.name : "Geen kookgroep"
		},
	],
};

</script>

<style></style>