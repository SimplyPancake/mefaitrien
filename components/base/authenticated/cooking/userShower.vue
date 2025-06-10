<template>
	<div>
		<!-- If no group is selected, show everyone! -->
		<UiListbox :highlight-on-hover="false">
			<UiListboxContent>
				<template v-for="group in groupInfo" :key="group.id">
					<UiListboxGroup class="animate-fadeIn">
						<UiListboxGroupLabel>{{ group.name }}</UiListboxGroupLabel>
						<template v-if="group.people.length > 0">
							<template v-for="p in group.people" :key="p.id">
								<UiListboxItem :value="p">
									<div class="flex items-center gap-5">
										<UiAvatar src="/img/dannyprofielfoto.png" class="size-8" />
										<div class="text-sm">
											<p class="font-medium">{{ p.name }}</p>
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

const props = defineProps<{
	groupInfo: GroupUsersDto[];
}>()
</script>

<style></style>