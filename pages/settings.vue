<template>
	<div class="mx-auto flex w-full max-w-3xl flex-col gap-6">
		<header class="flex flex-col gap-1">
			<p class="text-sm font-medium text-primary">Account</p>
			<h1 class="text-3xl font-bold tracking-tight">Instellingen</h1>
			<p class="text-sm text-muted-foreground">Pas je e-mailadres of wachtwoord aan.</p>
		</header>

		<UiCard title="Profielfoto">
			<template #content>
				<UiCardContent class="grid gap-4">
					<p class="text-sm text-muted-foreground">
						Kies een afbeelding van maximaal 1 MB (JPEG, PNG, WebP of GIF).
					</p>
					<div class="flex items-center gap-4">
						<UserProfilePicture
							:size="64"
							:src="avatarPreview ?? avatarOverride"
							:alt="`Profielfoto van ${settings?.email ?? 'mij'}`"
							:fallback="email.slice(0, 1).toUpperCase() || '?'"
						/>
						<div class="grid gap-2">
							<UiLabel for="profile-image">Profielfoto kiezen</UiLabel>
							<input
								id="profile-image"
								ref="profileImageInput"
								type="file"
								accept="image/jpeg,image/png,image/webp,image/gif"
								:disabled="avatarSaving"
								class="block w-full text-sm text-foreground file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:font-medium file:text-primary-foreground hover:file:cursor-pointer disabled:opacity-50"
								@change="uploadAvatar"
							/>
						</div>
					</div>
				</UiCardContent>
			</template>
		</UiCard>

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

		<UiCard title="Kookdiensten in je agenda">
			<template #content>
				<UiCardContent class="grid gap-4">
					<p class="text-sm text-muted-foreground">
						Kopieer de persoonlijke agenda-URL om je kookdiensten in je agenda-app te abonneren.
						Iedereen met de link kan je kookdiensten bekijken. Vernieuw de link om de oude ongeldig te maken.
					</p>
					<div v-if="calendarUrl" class="grid gap-3">
						<div class="grid gap-2">
							<UiLabel for="calendar-url">Privé agenda-link</UiLabel>
							<UiInput id="calendar-url" :model-value="calendarUrl" readonly />
						</div>
						<div class="flex flex-wrap gap-2">
							<a
								:href="calendarUrl"
								target="_blank"
								rel="noopener noreferrer"
								class="inline-flex items-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
							>
								Download agenda (.ics)
							</a>
							<UiButton type="button" variant="outline" @click="copyCalendarUrl">
								Link kopiëren
							</UiButton>
							<UiButton type="button" variant="outline" :disabled="calendarSaving" @click="createCalendarLink">
								{{ calendarSaving ? "Bezig..." : "Vernieuw link" }}
							</UiButton>
						</div>
					</div>
					<UiButton v-else type="button" :disabled="calendarSaving" @click="createCalendarLink">
						{{ calendarSaving ? "Bezig..." : "Maak agenda-link" }}
					</UiButton>
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

const { data: settings, error: settingsError } = await useAPI<{
	id: number;
	email: string;
	calendarToken: string | null;
	avatarUrl: string | null;
}>("/api/account/settings");
if (settingsError.value) {
	useSonner.error(settingsError.value.statusMessage ?? "Kon je instellingen niet laden.");
}

const email = ref(settings.value?.email ?? "");
const calendarToken = ref(settings.value?.calendarToken ?? null);
const avatarOverride = ref<string | null>(null);
const avatarPreview = ref<string | null>(null);
const avatarSaving = ref(false);
const emailCurrentPassword = ref("");
const passwordCurrentPassword = ref("");
const newPassword = ref("");
const confirmPassword = ref("");
const emailSaving = ref(false);
const passwordSaving = ref(false);
const calendarSaving = ref(false);
const requestUrl = useRequestURL();
const calendarUrl = computed(() => calendarToken.value
	? new URL(`/api/calendar/${settings.value?.id}/${calendarToken.value}.ics`, requestUrl.origin).toString()
	: "");
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
		avatarPreview.value = content;
		await useNuxtApp().$api("/api/account/avatar", {
			method: "POST",
			body: {
				file: {
					name: file.name,
					type: file.type,
					size: String(file.size),
					lastModified: String(file.lastModified),
					content,
				},
			},
		});
		avatarOverride.value = content;
		avatarPreview.value = null;
		window.dispatchEvent(new Event("profile-picture-updated"));
		useSonner.success("Profielfoto bijgewerkt.");
	} catch (cause) {
		avatarPreview.value = null;
		useSonner.error(getErrorMessage(cause, "Kon de profielfoto niet bijwerken."));
	} finally {
		avatarSaving.value = false;
		input.value = "";
	}
};

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

const createCalendarLink = async () => {
	calendarSaving.value = true;
	try {
		const result = await useNuxtApp().$api<{ calendarToken: string }>("/api/account/calendar-token", {
			method: "POST",
		});
		calendarToken.value = result.calendarToken;
		useSonner.success("Agenda-link bijgewerkt.");
	} catch (cause) {
		useSonner.error(getErrorMessage(cause, "Kon geen agenda-link maken."));
	} finally {
		calendarSaving.value = false;
	}
};

const copyCalendarUrl = async () => {
	try {
		await navigator.clipboard.writeText(calendarUrl.value);
		useSonner.success("Agenda-link gekopieerd.");
	} catch (cause) {
		useSonner.error(getErrorMessage(cause, "Kon de agenda-link niet kopiëren."));
	}
};
</script>
