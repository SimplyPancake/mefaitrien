<template>
	<div class="flex flex-row gap-4 w-2/5">
		<UiSelect v-model="selectedGroupName" class="">
			<UiSelectTrigger placeholder="Kies kookgroep" />
			<UiSelectContent>
				<UiSelectGroup>
					<UiSelectItem v-for="group in props.groupInfo" :key="group.id" :value="group.name"
						:text="group.name" />
					<!-- <UiSelectItem :value="''" :key="" :text="'Geen groep geselecteerd'" /> -->
				</UiSelectGroup>
			</UiSelectContent>
		</UiSelect>
		<div class="flex items-center space-x-2">
			<UiSwitch id="auto-mode" @click="useAutomatic = !useAutomatic" />
			<UiLabel for="auto-mode">Automatische indeling</UiLabel>
		</div>
	</div>
	<div v-if="useAutomatic" class="text-sm text-gray-600 italic">
		Automatische planning actief, je kunt individuele dagen alsnog aanpassen
	</div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { type GroupUsersDto } from "~/types/dto";

const props = defineProps<{
	groupInfo: GroupUsersDto[];
}>()

const selectedGroupName = ref('');
const useAutomatic = ref(false)

const selectedGroup = computed(() => {
	return props.groupInfo.find(x => x.name == selectedGroupName.value)
})

defineExpose({
	selectedGroup,
	selectedGroupName,
	useAutomatic
})

</script>

<style scoped></style>