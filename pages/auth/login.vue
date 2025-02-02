<template>
	<div class="flex h-screen items-center justify-between">
		<div class="w-full md:w-1/2">
			<div class="mx-auto w-full max-w-[330px] px-5">
				<h1 class="text-2xl font-bold tracking-tight lg:text-3xl">Log in</h1>
				<p class="mt-1 text-muted-foreground">Zet je gebruikersnaam en wachtwoord hiero!</p>

				<form class="mt-10" @submit="submit">
					<fieldset :disabled="isSubmitting" class="grid gap-5">
						<div>
							<UiVeeInput label="Gebruikersnaam" type="text" name="username" placeholder="hans kazan" />
						</div>
						<div>
							<UiVeeInput label="Wachtwoord" type="password" name="password" />
						</div>
						<div>
							<UiButton class="w-full" type="submit" text="Log in" />
						</div>
					</fieldset>
				</form>
				<p class="mt-8 text-sm">
					<a class="font-semibold text-primary underline-offset-2 hover:underline cursor-pointer"
						@click="triggerConfetti()">Wachtwoord vergeten?</a>
				</p>
			</div>
		</div>
		<div class="hidden h-screen md:block md:w-1/2 lg:w-1/2">
			<img src="/img/henkie.png" alt="Henkie houdt van een lekker borreltje" class="size-full object-cover" />
		</div>
	</div>
</template>

<script lang="ts" setup>
import { object, string } from "yup";
import type { InferType } from "yup";
const { signIn } = useAuth();

definePageMeta({
	auth: {
		unauthenticatedOnly: true,
		navigateAuthenticatedTo: '/'
	}
})

useSeoMeta({
	title: "Log in",
});

const LoginSchema = object({
	username: string().required().label("Gebruikersnaam"),
	password: string().required().label("Password"),
});

const { handleSubmit, isSubmitting } = useForm<InferType<typeof LoginSchema>>({
	validationSchema: LoginSchema,
});

// TODO: Sonner light mode
const submit = handleSubmit(async (values) => {
	useSonner.promise(signIn(values, { callbackUrl: '/' }), {
		loading: "Inloggen...",
		success: "ingelogd!",
		error: (d: Error) => d.message
	})
});

const triggerConfetti = () => {
	useConfetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
};

</script>
