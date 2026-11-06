<template>
	<div class="mb-4 flex flex-col gap-4 lg:flex-row lg:items-start">
		<UiSelect v-model="selectedGroupName">
			<UiSelectTrigger class="lg:w-44 lg:shrink-0" placeholder="Kies kookgroep" />
			<UiSelectContent>
				<UiSelectGroup>
					<UiSelectItem v-for="group in props.groupInfo" :key="group.id" :value="group.name"
						:text="group.name" />
					<!-- <UiSelectItem :value="''" :key="" :text="'Geen groep geselecteerd'" /> -->
					<div v-if="selectedGroupName != ''" :class="styles({})" @click="removeSelection">Selectie opheffen
					</div>
				</UiSelectGroup>
			</UiSelectContent>
		</UiSelect>
		<div class="grid gap-2 lg:min-w-0 lg:flex-1 lg:grid-cols-3">
			<UiButton v-if="selectedGroupName != ''" class="w-full whitespace-normal" variant="outline" @click="emit('automaticOrganize')">{{
				selectedGroupName }} automatisch indelen</UiButton>
			<UiButton v-else class="w-full whitespace-normal" variant="outline" @click="emit('automaticOrganize')">Alles automatisch indelen</UiButton>

			<UiButton v-if="selectedGroupName != ''" class="w-full whitespace-normal" variant="outline" @click="emit('removeAssigned')">{{
				selectedGroupName }} indeling verwijderen</UiButton>
			<UiButton v-else class="w-full whitespace-normal" variant="outline" @click="emit('removeAssigned')">Volledige indeling verwijderen</UiButton>

			<UiButton class="w-full whitespace-normal" @click="emit('submitAssignees')">Indeling opslaan</UiButton>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { type GroupUsersDto } from "~/types/dto";

const props = defineProps<{
	groupInfo: GroupUsersDto[];
	loadingAuto?: boolean;
}>();

const selectedGroupName = ref('');

const selectedGroup = computed(() => {
	return props.groupInfo.find(x => x.name == selectedGroupName.value)
})

const emit = defineEmits<{
	(e: 'automaticOrganize'): void
	(e: 'submitAssignees'): void
	(e: 'removeAssigned'): void
}>();

defineExpose({
	selectedGroup,
	selectedGroupName,
})

const removeSelection = () => {
	selectedGroupName.value = "";
}

const styles = tv({
	base: "relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
});

</script>

<style scoped></style>