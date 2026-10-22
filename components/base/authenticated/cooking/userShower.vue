<template>
	<div>
		<!-- If no group is selected, show everyone! -->
		<UiListbox :highlight-on-hover="false" v-model="selected">
			<UiListboxContent>
				<template v-for="group in groupInfo" :key="group.id">
					<UiListboxGroup class="animate-fadeIn">
						<UiListboxGroupLabel>{{ group.name }}</UiListboxGroupLabel>
						<template v-if="group.people.length > 0">
							<template v-for="p in group.people" :key="p.id">
								<UiListboxItem :value="p" class="mb-1" :class="getUiListboxItemClass(p.availability)">
									<div class="flex items-center gap-5">
										<UserProfilePicture :user-id="p.id" :name="p.name" :size="32" />
										<div class="text-sm">
											<div class="flex items-center gap-2">
												<p class="font-medium">{{ p.name }}</p>
												<span
													v-if="!p.isActive"
													class="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
												>
													Inactief
												</span>
											</div>
										</div>
									</div>
								</UiListboxItem>
							</template>
						</template>
						<template v-else>
							<div class="flex items-center justify-center py-5 text-sm font-medium">
								<p>Er zijn geen mensen met die naam</p>
							</div>
						</template>
					</UiListboxGroup>
				</template>
			</UiListboxContent>
		</UiListbox>
	</div>
</template>

<script lang="ts" setup>
import { type GroupUsersDto } from "~/types/dto";
import type { AvailabilityType } from "@/generated/prisma/browser"
const selected = ref();

const props = defineProps<{
	groupInfo: GroupUsersDto[];
}>()

defineExpose({
	selectedPerson: selected
})

const getUiListboxItemClass = computed(() => {
	return (availability?: AvailabilityType) => {
		if (selected.value || !availability) return '';

		switch (availability) {
			case 'AVAILABLE':
				return 'bg-av-avail';
			case 'NEGATIVE':
				return 'bg-av-nega';
			case 'POSITIVE':
				return 'bg-av-posi';
			case 'UNAVAILABLE':
				return 'bg-av-unavail'
			default:
				return '';
		}
	};
});
</script>

<style></style>