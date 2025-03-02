<template>
	<div class="flex flex-row gap-4">
		<div class="basis-1/1">
			<template>
				<UiDatatable :data="data" :options="options" />
				<!-- <div class="flex items-center justify-between border-t px-6 py-6 text-sm">
					<p>Total</p>
					<p>
						{{formatCurrency(data.reduce((acc, item) => acc + item.balance, 0))}}
					</p>
				</div> -->
			</template>
		</div>
	</div>
</template>

<script lang="ts" setup>
useSeoMeta({
	title: "Admin Dashboard"
})

import type { Config } from "datatables.net";
import type { CookingGroup, User } from "@prisma/client"

const data = await $api<User[]>('/api/admin/users')
console.log(data)

const options: Config = {
	dom: `<'${tw`overflow-auto`}'table>`,
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
			render: (data: CookingGroup) => data.name
		},
	],
};

</script>

<style></style>