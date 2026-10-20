<template>
	<div class="mx-auto flex w-full max-w-3xl flex-col gap-6">
		<header class="flex flex-col gap-1">
			<p class="text-sm font-medium text-primary">Account</p>
			<h1 class="text-3xl font-bold tracking-tight">Instellingen</h1>
			<p class="text-sm text-muted-foreground">Pas je e-mailadres of wachtwoord aan.</p>
		</header>

		<UiCard title="E-mailadres wijzigen">
			<template #content>
				<UiCardContent>
					<form class="grid gap-5" @submit.prevent="saveEmail">
						<fieldset :disabled="emailSaving" class="grid gap-5">
							<div class="grid gap-2">
								<UiLabel for="settings-email">Nieuw e-mailadres</UiLabel>
								<p id="settings-email-hint" class="text-sm text-muted-foreground">
									Vul je nieuwe e-mailadres in.
								</p>
								<UiInput id="settings-email" v-model="email" type="email" autocomplete="email"
									aria-describedby="settings-email-hint" required />
							</div>
							<div class="grid gap-2">
								<UiLabel for="email-current-password">Huidig wachtwoord</UiLabel>
								<p id="email-current-password-hint" class="text-sm text-muted-foreground">
									<!-- Voer je huidige wachtwoord in om deze wijziging te bevestigen. -->
								</p>
								<UiInput id="email-current-password" v-model="emailCurrentPassword" type="password"
									autocomplete="current-password" aria-describedby="email-current-password-hint" required />
							</div>
							<div>
								<UiButton type="submit" :disabled="!email || !emailCurrentPassword">
									{{ emailSaving ? "Opslaan..." : "E-mailadres opslaan" }}
								</UiButton>
							</div>
						</fieldset>
					</form>
				</UiCardContent>
			</template>
		</UiCard>

		<UiCard title="Wachtwoord wijzigen">
			<template #content>
				<UiCardContent>
					<form class="grid gap-5" @submit.prevent="savePassword">
						<fieldset :disabled="passwordSaving" class="grid gap-5">
							<div class="grid gap-2">
								<UiLabel for="password-current-password">Huidig wachtwoord</UiLabel>
								<p id="password-current-password-hint" class="text-sm text-muted-foreground">
									<!-- Voer je huidige wachtwoord in om de wijziging te bevestigen. -->
								</p>
								<UiInput id="password-current-password" v-model="passwordCurrentPassword" type="password"
									autocomplete="current-password" aria-describedby="password-current-password-hint" required />
							</div>
							<div class="grid gap-2">
								<UiLabel for="new-password">Nieuw wachtwoord</UiLabel>
								<p id="new-password-hint" class="text-sm text-muted-foreground">
									Kies een wachtwoord van minimaal 8 tekens.
								</p>
								<UiInput id="new-password" v-model="newPassword" type="password"
									autocomplete="new-password" aria-describedby="new-password-hint" minlength="8" required />
							</div>
							<div class="grid gap-2">
								<UiLabel for="confirm-password">Herhaal nieuw wachtwoord</UiLabel>
								<p id="confirm-password-hint" class="text-sm text-muted-foreground">
									<!-- Voer hetzelfde nieuwe wachtwoord nogmaals in. -->
								</p>
								<UiInput id="confirm-password" v-model="confirmPassword" type="password"
									autocomplete="new-password" aria-describedby="confirm-password-hint" minlength="8" required />
							</div>
							<div>
								<UiButton type="submit"
									:disabled="!passwordCurrentPassword || !newPassword || !confirmPassword">
									{{ passwordSaving ? "Opslaan..." : "Wachtwoord opslaan" }}
								</UiButton>
							</div>
						</fieldset>
					</form>
				</UiCardContent>
			</template>
		</UiCard>
	</div>
</template>

<script setup lang="ts">
usePageInfoStore().setPageInfo({ title: "Instellingen" });
useSeoMeta({ title: "Instellingen" });

const { data: settings, error: settingsError } = await useAPI<{ email: string }>("/api/account/settings");
if (settingsError.value) {
	useSonner.error(settingsError.value.statusMessage ?? "Kon je instellingen niet laden.");
}

const email = ref(settings.value?.email ?? "");
const emailCurrentPassword = ref("");
const passwordCurrentPassword = ref("");
const newPassword = ref("");
const confirmPassword = ref("");
const emailSaving = ref(false);
const passwordSaving = ref(false);

const getErrorMessage = (cause: unknown, fallback: string) => {
	const error = cause as { data?: { statusMessage?: string }; statusMessage?: string };
	return error.data?.statusMessage ?? error.statusMessage ?? fallback;
};

const saveEmail = async () => {
	emailSaving.value = true;
	try {
		const updated = await useNuxtApp().$api<{ email: string }>("/api/account/settings", {
			method: "PUT",
			body: { email: email.value, currentPassword: emailCurrentPassword.value },
		});
		email.value = updated.email;
		emailCurrentPassword.value = "";
		useSonner.success("E-mailadres bijgewerkt.");
	} catch (cause) {
		useSonner.error(getErrorMessage(cause, "Kon het e-mailadres niet bijwerken."));
	} finally {
		emailSaving.value = false;
	}
};

const savePassword = async () => {
	if (newPassword.value !== confirmPassword.value) {
		useSonner.error("De nieuwe wachtwoorden komen niet overeen.");
		return;
	}

	passwordSaving.value = true;
	try {
		await useNuxtApp().$api("/api/account/password", {
			method: "POST",
			body: { currentPassword: passwordCurrentPassword.value, newPassword: newPassword.value },
		});
		passwordCurrentPassword.value = "";
		newPassword.value = "";
		confirmPassword.value = "";
		useSonner.success("Wachtwoord bijgewerkt.");
	} catch (cause) {
		useSonner.error(getErrorMessage(cause, "Kon het wachtwoord niet bijwerken."));
	} finally {
		passwordSaving.value = false;
	}
};
</script>
