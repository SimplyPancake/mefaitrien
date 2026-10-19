<template>
	<UiDialog v-model:open="isOpen">
		<UiDialogTrigger as-child>
			<UiButton variant="outline" text="Nieuwe account" />
		</UiDialogTrigger>
		<UiDialogContent class="sm:max-w-lg">
			<UiDialogHeader>
				<UiDialogTitle>Nieuw account</UiDialogTitle>
				<UiDialogDescription>
					Maak een account aan. De gebruiker kan met deze gegevens inloggen.
				</UiDialogDescription>
			</UiDialogHeader>
			<form id="create-user-form" class="grid gap-4" @submit.prevent="submit">
				<UiVeeInput
					v-model="formValues.name"
					label="Naam"
					name="name"
					placeholder="Volledige naam"
					required
				/>
				<UiVeeInput
					v-model="formValues.username"
					label="Gebruikersnaam"
					name="username"
					placeholder="Gebruikersnaam"
					required
				/>
				<UiVeeInput
					v-model="formValues.email"
					label="E-mailadres"
					name="email"
					type="email"
					placeholder="naam@voorbeeld.nl"
					required
				/>
				<div>
					<UiLabel for="new-user-cooking-group" class="mb-2">Kookgroep</UiLabel>
					<UiSelect id="new-user-cooking-group" v-model="selectedGroupId">
						<UiSelectTrigger placeholder="Kies een kookgroep" />
						<UiSelectContent>
							<UiSelectItem value="none" text="Geen kookgroep" />
							<UiSelectItem
								v-for="group in props.cookingGroups"
								:key="group.id"
								:value="String(group.id)"
								:text="group.name"
							/>
						</UiSelectContent>
					</UiSelect>
				</div>
				<UiVeeInput
					v-model="formValues.password"
					label="Wachtwoord"
					name="password"
					type="password"
					hint="Gebruik minimaal 8 tekens."
					required
				/>
			</form>
			<UiDialogFooter>
				<UiButton
					type="button"
					variant="outline"
					text="Annuleren"
					:disabled="isSubmitting"
					@click="isOpen = false"
				/>
				<UiButton
					type="submit"
					form="create-user-form"
					text="Account aanmaken"
					:loading="isSubmitting"
				/>
			</UiDialogFooter>
		</UiDialogContent>
	</UiDialog>
</template>

<script lang="ts" setup>
import { object, string } from "yup";
import type { InferType } from "yup";
import type { CookingGroup } from "@/generated/prisma/browser";

const props = defineProps<{
	cookingGroups: Pick<CookingGroup, "id" | "name">[];
}>();
const emit = defineEmits<{
	created: [];
}>();

const isOpen = ref(false);
const selectedGroupId = ref("none");
const schema = object({
	name: string().trim().required("Naam is verplicht"),
	username: string().trim().required("Gebruikersnaam is verplicht"),
	email: string().trim().email("Vul een geldig e-mailadres in").required("E-mailadres is verplicht"),
	password: string().min(8, "Gebruik minimaal 8 tekens").required("Wachtwoord is verplicht"),
});
const { handleSubmit, isSubmitting, resetForm, values: formValues } = useForm<InferType<typeof schema>>(
	{
		validationSchema: schema,
		initialValues: {
			name: "",
			username: "",
			email: "",
			password: "",
		},
	}
);

const submit = handleSubmit(async (values) => {
	try {
		const api = useNuxtApp().$api;
		await api("/api/admin/users", {
			method: "POST",
			body: {
				...values,
				cookingGroupId: selectedGroupId.value === "none" ? null : Number(selectedGroupId.value),
			},
		});

		useSonner.success("Account aangemaakt.");
		resetForm();
		selectedGroupId.value = "none";
		isOpen.value = false;
		emit("created");
	} catch (error) {
		useSonner.error(error instanceof Error ? error.message : "Account aanmaken is mislukt.");
	}
});
</script>
