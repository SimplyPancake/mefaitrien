<template>
	<UiTable v-if="data">
		<UiTableHeader>
			<UiTableRow>
				<UiTableHead>Persoon</UiTableHead>
				<UiTableHead>Email</UiTableHead>
				<UiTableHead>Kookgroep</UiTableHead>
				<UiTableHead>Rol</UiTableHead>
				<UiTableHead class="pl-0">
					<span class="sr-only">Acties</span>
				</UiTableHead>
			</UiTableRow>
		</UiTableHeader>
		<UiTableBody>
			<template v-for="user in data.users" :key="user.id">
				<UiTableRow>
					<UiTableCell>
						<div class="flex items-center gap-3">
							<UiAvatar class="size-10" src="/img/dannyprofielfoto.png" :alt="user.name" />
							<div>
								<div class="font-lg font-bold">{{ user.name }}</div>
								<span class="mt-0.5 text-xs text-muted-foreground">@{{
									user.username }}</span>
							</div>
						</div>
					</UiTableCell>
					<UiTableCell>{{ user.email }}</UiTableCell>
					<UiTableCell>{{ user.cookingGroup?.name ?? "Geen kookgroep" }}</UiTableCell>
					<UiTableCell>{{ user.role }}</UiTableCell>
					<UiTableCell class="pl-0 text-right">
						<!-- <UiButton size="sm" variant="linkHover2">Wijzig</UiButton> -->
						<BaseAuthenticatedAdminEditUser :user="user" :cooking-groups="data.cookingGroups" />
					</UiTableCell>
				</UiTableRow>
			</template>
		</UiTableBody>
	</UiTable>
	<div class="flex justify-end p-4">
		<BaseAuthenticatedAdminCreateUser
			:cooking-groups="data?.cookingGroups ?? []"
			@created="refresh()"
		/>
	</div>
</template>

<script lang="ts" setup>
import type { AdminUsersDTO } from '@/types/dto';

const { data, status, refresh } = await useAPI<AdminUsersDTO>('/api/admin/users');
</script>

<style>
/* Add custom styles for the datatable card */
</style>