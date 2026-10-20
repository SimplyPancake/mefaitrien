<template>
	<div class="flex justify-center">
		<UiDialog>
			<UiDialogTrigger as-child @click="discardChanges">
				<UiButton variant="outline" text="Wijzig" />
			</UiDialogTrigger>
			<UiDialogContent
				class="flex flex-col gap-0 p-0 sm:max-h-[min(640px,80vh)] sm:max-w-lg [&>button:last-child]:hidden">
				<div class="overflow-y-auto">
					<UiDialogHeader class="contents space-y-0 text-left">
						<UiDialogTitle class="px-6 pt-6 text-lg font-semibold">
							Wijzig gebruiker
						</UiDialogTitle>
						<UiDialogDescription>
							<div class="p-6 space-y-6">
								<form class="space-y-4">
									<UiVeeInput v-model="userref.name" label="Naam" type="text" name="name"
										placeholder="Voer naam in" />
									<UiVeeInput v-model="userref.username" label="Gebruikersnaam" type="text"
										name="name" placeholder="Voer gebruikersnaam in" />
									<UiVeeInput v-model="userref.email" label="Email" type="email" name="email"
										placeholder="Voer email in" />
									<div class="space-y-2">
										<UiLabel class="block text-sm font-medium text-gray-700">Rollen</UiLabel>
										<label
											v-for="role in roleOptions"
											:key="role.value"
											class="flex items-center gap-2"
										>
											<UiCheckbox
												:checked="userref.roles.includes(role.value)"
												:disabled="userref.roles.length === 1 && userref.roles.includes(role.value)"
												@update:checked="toggleRole(role.value, $event)"
											/>
											<span>{{ role.label }}</span>
										</label>
									</div>
									<div>
										<UiLabel for="cooking-group"
											class="block mb-2 text-sm font-medium text-gray-700">Kookgroep</UiLabel>
										<UiSelect id="cooking-group" v-model="cookingGroupname">
											<UiSelectTrigger placeholder="Kies een kookgroep" />
											<UiSelectSeparator />
											<UiSelectContent>
												<UiSelectLabel>Kookgroepen</UiSelectLabel>
												<UiSelectItem v-for="cookGroup in props.cookingGroups"
													:key="cookGroup.id" :value="cookGroup.name"
													:text="cookGroup.name" />
											</UiSelectContent>
										</UiSelect>
									</div>
								</form>
							</div>
						</UiDialogDescription>
					</UiDialogHeader>
				</div>
				<UiDialogFooter class="border-t border-border px-6 py-4 flex justify-end gap-4">
					<UiDialogClose as-child>
						<UiButton type="button" variant="outline" text="Cancel" @click="discardChanges" />
					</UiDialogClose>
					<UiDialogClose as-child>
						<UiButton type="button" text="Opslaan" @click="saveChanges" />
					</UiDialogClose>
				</UiDialogFooter>
			</UiDialogContent>
		</UiDialog>
	</div>
</template>

<script lang="ts" setup>
import type { AdminUserDTO } from '~/types/dto';
import type { CookingGroup } from '@/generated/prisma/browser';
import { Role } from '@/generated/prisma/browser';
import type { Role as RoleType } from '@/generated/prisma/browser';
import { cloneDeep } from 'lodash';
import { useAPI } from '~/composables/useAPI';

const props = defineProps<{
	user: AdminUserDTO;
	cookingGroups: CookingGroup[];
}>();

const userref = ref(cloneDeep(props.user))

const cookingGroupname = ref(props.user.cookingGroup?.name ?? '');
const roleOptions: { value: RoleType; label: string }[] = [
	{ value: Role.ADMIN, label: 'Admin' },
	{ value: Role.COOKING, label: 'Kookbeheer' },
	{ value: Role.USER, label: 'Gebruiker' },
];

const toggleRole = (role: RoleType, checked: boolean | 'indeterminate') => {
	if (checked === true && !userref.value.roles.includes(role)) {
		userref.value.roles.push(role);
	} else if (checked === false && userref.value.roles.length > 1) {
		userref.value.roles = userref.value.roles.filter(currentRole => currentRole !== role);
	}
};

const saveChanges = async () => {
	const selectedCookingGroup = props.cookingGroups.find(group => group.name === cookingGroupname.value);
	if (selectedCookingGroup) {
		userref.value.cookingGroup = { id: selectedCookingGroup.id, name: selectedCookingGroup.name };
	}

	const { data, error } = await useAPI('/api/admin/user', {
		method: 'POST',
		body: {
			id: userref.value.id,
			name: userref.value.name,
			username: userref.value.username,
			email: userref.value.email,
			roles: userref.value.roles,
			cookingGroupId: selectedCookingGroup?.id,
		},
	});

	if (data.value) {
		console.log(data)
		Object.assign(props.user, cloneDeep(userref.value));
		useSonner.success('Gebruiker succesvol bijgewerkt!');
	} else if (error) {
		console.log(error.value)
		useSonner.error(error.value?.statusMessage ?? "Er is iets fout gegaan")
	}
};

const discardChanges = () => {
	userref.value = cloneDeep(props.user);
}
</script>

<style>
/* Add custom styles for better spacing and alignment */
</style>