<template>
	<div class="flex h-screen items-center justify-between">
		<div class="w-full md:w-1/2">
			<div class="mx-auto w-full max-w-[330px] px-5">
				<h1 class="text-2xl font-bold tracking-tight lg:text-3xl">Log in</h1>
				<p class="mt-1 text-muted-foreground">Zet je email en wachtwoord hiero!</p>

				<form class="mt-10" @submit="submit">
					<fieldset :disabled="isSubmitting" class="grid gap-5">
						<div>
							<UiVeeInput label="Email" type="email" name="email" placeholder="tinus@cocaine.com" />
						</div>
						<div>
							<UiVeeInput label="Password" type="password" name="wachtwoord" />
						</div>
						<div>
							<UiButton class="w-full" type="submit" text="Log in" />
						</div>
					</fieldset>
				</form>
				<p class="mt-8 text-sm">
					<a class="font-semibold text-primary underline-offset-2 hover:underline cursor-pointer" @click="triggerConfetti()">Wachtwoord vergeten?</a>
				</p>
			</div>
		</div>
		<div class="hidden h-screen md:block md:w-1/2 lg:w-1/2">
			<img src="https://images.unsplash.com/photo-1512551980832-13df02babc9e?q=60&w=2864&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
				alt="Login form image" class="size-full object-cover" />
		</div>
	</div>
</template>

<script lang="ts" setup>
import { object, string } from "yup";
import type { InferType } from "yup";

definePageMeta({ auth: false })

useSeoMeta({
	title: "Log in",
	description: "Enter your email & password to log in.",
});

const LoginSchema = object({
	email: string().email().required().label("Email"),
	password: string().required().label("Password").min(8),
});

const { handleSubmit, isSubmitting } = useForm<InferType<typeof LoginSchema>>({
	validationSchema: LoginSchema,
});

const submit = handleSubmit((values) => {
	console.log(values);
});

const triggerConfetti = () => {
    useConfetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
};

</script>
