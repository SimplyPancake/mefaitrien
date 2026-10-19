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
									<div>
										<UiLabel for="user-role" class="block mb-2 text-sm font-medium text-gray-700">
											Rol</UiLabel>
										<UiSelect id="user-role" v-model="userref.role">
											<UiSelectTrigger placeholder="Kies een rol" />
											<UiSelectSeparator />
											<UiSelectContent>
												<UiSelectLabel>Rollen</UiSelectLabel>
												<UiSelectItem key="ADMIN" value="ADMIN" text="Admin" />
												<UiSelectItem key="COOKING" value="COOKING" text="Kookbeheer" />
												<UiSelectItem key="USER" value="USER" text="Gebruiker" />
											</UiSelectContent>
										</UiSelect>
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
import { cloneDeep } from 'lodash';
import { useAPI } from '~/composables/useAPI';

const props = defineProps<{
	user: AdminUserDTO;
	cookingGroups: CookingGroup[];
}>();

const userref = ref(cloneDeep(props.user))

const cookingGroupname = ref(props.user.cookingGroup?.name ?? '');

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
			role: userref.value.role,
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