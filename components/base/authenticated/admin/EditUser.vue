<template>
	<div class="flex justify-center">
		<UiDialog v-model:open="isOpen">
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
									<div class="flex items-center gap-3">
										<UserProfilePicture :user-id="userref.id" :name="userref.name" :size="48" />
										<div class="grid gap-2">
											<UiLabel for="admin-profile-image">Profielfoto (maximaal 1 MB)</UiLabel>
											<input
												id="admin-profile-image"
												type="file"
												accept="image/jpeg,image/png,image/webp,image/gif"
												:disabled="avatarSaving"
												class="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:font-medium file:text-primary-foreground"
												@change="uploadAvatar"
											/>
										</div>
									</div>
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
									<div class="flex items-center justify-between">
										<UiLabel for="account-active" class="text-sm font-medium">Account actief</UiLabel>
										<UiSwitch id="account-active" v-model:checked="userref.isActive" />
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
					<UiButton type="button" text="Opslaan" @click="saveChanges" />
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
const isOpen = ref(false);
const avatarSaving = ref(false);

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

const uploadAvatar = async (event: Event) => {
	const input = event.target as HTMLInputElement;
	const file = input.files?.[0];
	if (!file) return;
	if (file.size > 1024 * 1024) {
		useSonner.error("De afbeelding mag maximaal 1 MB zijn.");
		input.value = "";
		return;
	}

	avatarSaving.value = true;
	try {
		const content = await new Promise<string>((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => typeof reader.result === "string"
				? resolve(reader.result)
				: reject(new Error("Kon de afbeelding niet lezen."));
			reader.onerror = () => reject(reader.error ?? new Error("Kon de afbeelding niet lezen."));
			reader.readAsDataURL(file);
		});
		const { error } = await useAPI("/api/admin/user-avatar", {
			method: "POST",
			body: {
				userId: userref.value.id,
				file: {
					name: file.name,
					type: file.type,
					size: String(file.size),
					lastModified: String(file.lastModified),
					content,
				},
			},
		});
		if (error.value) {
			useSonner.error(error.value.statusMessage ?? "Kon de profielfoto niet bijwerken.");
			return;
		}

		window.dispatchEvent(new Event("profile-picture-updated"));
		useSonner.success("Profielfoto bijgewerkt.");
	} catch (cause) {
		useSonner.error(cause instanceof Error ? cause.message : "Kon de profielfoto niet bijwerken.");
	} finally {
		avatarSaving.value = false;
		input.value = "";
	}
};

const saveChanges = async () => {
	const selectedCookingGroup = props.cookingGroups.find(group => group.name === cookingGroupname.value);
	userref.value.cookingGroup = selectedCookingGroup
		? { id: selectedCookingGroup.id, name: selectedCookingGroup.name }
		: undefined;

	try {
		const { data, error } = await useAPI('/api/admin/user', {
			method: 'POST',
			body: {
				id: userref.value.id,
				name: userref.value.name,
				username: userref.value.username,
				email: userref.value.email,
				roles: userref.value.roles,
				cookingGroupId: selectedCookingGroup?.id ?? null,
				isActive: userref.value.isActive,
			},
		});

		if (error.value) {
			useSonner.error(error.value.statusMessage ?? "Er is iets fout gegaan");
			return;
		}
		if (!data.value) {
			useSonner.error("Gebruiker opslaan is mislukt.");
			return;
		}

		Object.assign(props.user, cloneDeep(userref.value));
		useSonner.success('Gebruiker succesvol bijgewerkt!');
		isOpen.value = false;
	} catch (cause) {
		useSonner.error(cause instanceof Error ? cause.message : "Gebruiker opslaan is mislukt.");
	}
};

const discardChanges = () => {
	userref.value = cloneDeep(props.user);
	cookingGroupname.value = props.user.cookingGroup?.name ?? '';
}
</script>

<style>
/* Add custom styles for better spacing and alignment */
</style>