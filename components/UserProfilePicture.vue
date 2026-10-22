<template>
	<UiAvatar
		:src="src ?? imageUrl ?? undefined"
		:alt="alt ?? `Profielfoto van ${name ?? sessionStore.sessionData?.name ?? 'gebruiker'}`"
		:fallback="fallback ?? name?.slice(0, 1).toUpperCase() ?? sessionStore.sessionData?.name?.slice(0, 1).toUpperCase() ?? '?'"
		class="text-sm"
		:style="{ width: `${size}px`, height: `${size}px` }"
	/>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
	size?: number;
	userId?: number;
	name?: string;
	src?: string | null;
	alt?: string;
	fallback?: string;
}>(), {
	size: 40,
});

const sessionStore = useSessionStore();
const imageUrl = ref<string | null>(null);
let imageObjectUrl: string | null = null;

const loadImage = async () => {
	const userId = props.userId ?? sessionStore.sessionData?.id;
	if (!userId) return;

	try {
		const image = await useNuxtApp().$api<Blob>(`/api/account/avatar?userId=${userId}`, { responseType: "blob" });
		if (imageObjectUrl) URL.revokeObjectURL(imageObjectUrl);
		imageObjectUrl = URL.createObjectURL(image);
		imageUrl.value = imageObjectUrl;
	} catch (cause) {
		const error = cause as { status?: number; statusCode?: number };
		if (error.status === 404 || error.statusCode === 404) return;
		useSonner.error(getErrorMessage(cause, "Kon de profielfoto niet laden."));
	}
};

onMounted(() => {
	void loadImage();
	window.addEventListener("profile-picture-updated", loadImage);
});

onBeforeUnmount(() => {
	window.removeEventListener("profile-picture-updated", loadImage);
	if (imageObjectUrl) URL.revokeObjectURL(imageObjectUrl);
});

const getErrorMessage = (cause: unknown, fallback: string) => {
	const error = cause as { data?: { statusMessage?: string }; statusMessage?: string };
	return error.data?.statusMessage ?? error.statusMessage ?? fallback;
};
</script>
