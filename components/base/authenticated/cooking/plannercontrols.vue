<template>
	<div class="flex flex-row gap-4 w-2/5">
		<UiSelect v-model="selectedGroup" class="">
			<UiSelectTrigger placeholder="Kies kookgroep" />
			<UiSelectContent>
				<UiSelectGroup>
					<UiSelectItem v-for="group in groups" :key="group.id" :value="group.id" :text="group.name" />
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

interface Group {
	id: string;
	name: string;
}

const groups = [
	{ id: 'groep1', name: 'Groep 1' },
	{ id: 'groep2', name: 'Groep 2' },
]

const selectedGroup = ref('');
const useAutomatic = ref(false)

defineExpose({
	selectedGroup,
	useAutomatic
})

</script>

<style scoped>
input[type='radio'] {
	accent-color: #3b82f6;
	/* Tailwind 'blue-500' */
}
</style>