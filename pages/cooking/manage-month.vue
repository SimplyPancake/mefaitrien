<template>
	<!-- Manage cooking rosters (CRUD per year) -->
	<!-- View users who haven't filled in for this and/or upcoming month -->
	<div class="grid grid-cols-3 grid-rows-6 gap-4">
		<div class="row-span-2">
			<UiCard title="Kies een maand">
				<template #content>
					<UiCardContent>
						<UiMonthChooser ref="monthchooser" />
					</UiCardContent>
				</template>
			</UiCard>
		</div>
		<div class="col-span-2 row-span-2">
			<UiCard title="Maand informatie">
				<template #content>
					<UiCardContent>
						<UiDescriptionList class="pb-4">
							<template v-if="selectedMonth">
								<UiDescriptionListTerm>Maandstatus</UiDescriptionListTerm>
								<UiDescriptionListDetails>
									<UiSelect :model-value="selectedMonth.status" @update:model-value="changeMonthStatus"
										:disabled="savingMonthStatus">
										<UiSelectTrigger aria-label="Maandstatus" />
										<UiSelectContent>
											<UiSelectGroup>
												<UiSelectItem value="CANFILLIN" text="Inschrijven mogelijk" />
												<UiSelectItem value="NOFILLIN" text="Inschrijven gesloten" />
												<UiSelectItem value="ASSIGNED" text="Ingedeeld" />
											</UiSelectGroup>
										</UiSelectContent>
									</UiSelect>
								</UiDescriptionListDetails>
							</template>
							<template v-for="item in items" :key="item.term">
								<UiDescriptionListTerm>{{ item.term }}</UiDescriptionListTerm>
								<UiDescriptionListDetails>{{ item.details }}</UiDescriptionListDetails>
							</template>
						</UiDescriptionList>

						<!-- Maand bestaat nog niet -->
						<!-- Link naar aanmaken OF doe het hier. Maakt voor nu nog niet uit. -->
						<template v-if="emptyMonth">
							<NuxtLink href="/cooking/create">
								<UiButton>
									Maak een nieuwe maand aan
								</UiButton>
							</NuxtLink>
						</template>

					</UiCardContent>
				</template>
			</UiCard>
		</div>
		<BaseAuthenticatedCookingEditMonthAvailability v-if="selectedMonth" :month="selectedMonth"
			:group-data="groupsData" @assignments-saved="refreshCreatedMonths" />
	</div>
</template>

<script lang="ts" setup>
import { useTemplateRef, ref } from 'vue';
import { UiMonthChooser } from '#components';
import type { GroupUsersDto, ManageMonthDto } from '~/types/dto';

usePageInfoStore().setPageInfo({
	title: 'Kookmaand beheren',
});

useSeoMeta({
	title: "Kookmaand beheren"
})

type ChooserType = InstanceType<typeof UiMonthChooser>

const chooserref = useTemplateRef<ChooserType>('monthchooser')
const { data: groupData, error } = await useAPI<GroupUsersDto[]>('/api/cooking/users?includeInactive=true');

const items = computed(() => {
	if (selectedMonth.value) {
		return [
			{ term: "Mensen ingevuld", details: `${selectedMonth.value.filledIn}/${selectedMonth.value.maxAssigned}` },
			{ term: "Gemiddelde beschikbaarheid", details: `${selectedMonth.value.averageAvailability}%` },
			{ term: "Dagen zonder beschikbare kok", details: `${selectedMonth.value.daysWithoutCook ?? 'n.v.t.'}` },
			{
				term: "Laatste wijziging", details: `${selectedMonth.value.updatedAt}`
			},
		]
	}

	return [
		{ term: "Maand type", details: "Nog aan te maken" },
		{ term: "Mensen ingevuld", details: "n.v.t." },
		{ term: "Laatste wijziging", details: "n.v.t." },
		{ term: "Dagen zonder beschikbare kok", details: "n.v.t." },
		{ term: "Gemiddelde beschikbaarheid", details: "n.v.t." },
	]
})

const { data: createdmonths, error: createdmonthserror, refresh: refreshCreatedMonths } = await useAPI<ManageMonthDto[]>('/api/cooking/roster/manage');
const savingMonthStatus = ref(false);
if (createdmonthserror.value) {
	console.log(createdmonthserror.value)
	useSonner.error("Kon oude maanden niet ophalen!")
}

const selectedMonth = computed(() => {
	return createdmonths.value?.find(x => x.year == chooserref.value?.selectedyear && x.month == chooserref.value.selectedmonth)
})

const changeMonthStatus = async (status: string) => {
	if (status !== "CANFILLIN" && status !== "NOFILLIN" && status !== "ASSIGNED") {
		return;
	}

	if (!selectedMonth.value || savingMonthStatus.value) {
		return;
	}

	savingMonthStatus.value = true;
	try {
		const api = useNuxtApp().$api as typeof $fetch;
		await api(
			`/api/cooking/roster/${selectedMonth.value.year}/${selectedMonth.value.month}/status`,
			{ method: "POST", body: { status } }
		);
		await refreshCreatedMonths();
		useSonner.success("Maandstatus gewijzigd.");
	} catch (cause) {
		const error = cause as { data?: { statusMessage?: string }; statusMessage?: string };
		useSonner.error(error.data?.statusMessage ?? error.statusMessage ?? "Kon de maandstatus niet wijzigen.");
	} finally {
		savingMonthStatus.value = false;
	}
};

const groupsData = computed(() => {
	const groups = groupData.value ?? [];
	const selectedYear = chooserref.value?.selectedyear;
	const selectedNumber = chooserref.value?.selectedmonth;
	const currentDate = new Date();
	const isHistorical =
		selectedYear !== undefined &&
		selectedNumber !== undefined &&
		(selectedYear < currentDate.getFullYear() ||
			(selectedYear === currentDate.getFullYear() && selectedNumber < currentDate.getMonth() + 1));

	return groups
		.map(group => ({
			...group,
			people: isHistorical
				? group.people
				: group.people.filter(person => person.isActive),
		}))
		.filter(group => group.id !== -1 && group.people.length > 0);
})

const emptyMonth = computed(() => {
	return !selectedMonth.value
})

</script>

<style></style>