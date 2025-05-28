<template>
	<UiSidebarProvider>
		<UiSidebar>
			<UiSidebarContent>
				<UiSidebarGroup>
					<div class="flex flex-row items-center gap-4">
						<UiAvatar src="/img/logo.png" class="size-16 rounded-none" />
						<div class="text-lg font-bold">
							Me Fait Rien
						</div>
					</div>
				</UiSidebarGroup>
				<UiSidebarGroup>
					<UiDivider class="text-primary" />
				</UiSidebarGroup>

				<!-- Sidebar sections -->
				<UiSidebarGroup v-for="(section, sIdx) in visibleSidebarSections" :key="sIdx">
					<UiSidebarGroupLabel v-if="section.label" :class="section.labelClass">{{ section.label }}
					</UiSidebarGroupLabel>
					<UiSidebarGroupContent>
						<UiSidebarMenu>
							<UiSidebarMenuItem v-for="item in section.items" :key="item.title">
								<UiSidebarMenuButton as-child v-if="item.url">
									<NuxtLink :to="item.url">
										<Icon :name="item.icon" style="color: var(--primary)" class="size-6 mr-2" />
										<span class="font-semibold text-xl">{{ item.title }}</span>
									</NuxtLink>
								</UiSidebarMenuButton>
								<UiSidebarMenuButton v-else @click="item.action && handleSidebarAction(item.action)">
									<Icon :name="item.icon" style="color: var(--primary)" class="size-6 mr-2" />
									<span class="font-semibold text-xl">{{ item.title }}</span>
								</UiSidebarMenuButton>
								<UiSidebarMenuSubItem v-for="(child, k) in item.items" :key="`child-${k}`">
									<UiSidebarMenuSubButton as-child>
										<NuxtLink :href="child.url">
											{{ child.title }}
										</NuxtLink>
									</UiSidebarMenuSubButton>
								</UiSidebarMenuSubItem>
							</UiSidebarMenuItem>
						</UiSidebarMenu>
					</UiSidebarGroupContent>
				</UiSidebarGroup>

				<!-- Sidebar footer -->
				<UiSidebarFooter class="mt-auto mb-5">
					<div class="flex items-center flex-row gap-4">
						<UiAvatar src="/img/dannyprofielfoto.png" class="size-16" />
						<div class="font-semibold text-lg basis-1/2">
							<div>{{ sessionStore!.sessionData!.name || '' }}</div>
							<div class="text-base text-gray-500">{{ sessionStore!.sessionData!.cookingGroup ||
								'Geenkookgroep' }}</div>
						</div>
						<UiButton size="icon" variant="default"
							class="basis-1/6 bg-sidebar-accent text-sidebar-foreground hover:bg-sidebar-accent/80 border-none"
							@click="changeColors">
							<Icon class="size-7" name="lucide:paintbrush" />
						</UiButton>
					</div>
				</UiSidebarFooter>
			</UiSidebarContent>
		</UiSidebar>
		<UiSidebarInset>
			<!-- TODO: Navbar online on mobile -->
			<!-- <UiNavbar sticky>
				<UiContainer class="flex h-12 items-center">
					<UiSidebarTrigger />
				</UiContainer>
			</UiNavbar> -->
			<div class="p- text-foreground p-4">
				<slot />
			</div>
		</UiSidebarInset>
	</UiSidebarProvider>
</template>

<script lang="ts" setup>
import { UiDropdownMenu, UiDropdownMenuContent, UiDropdownMenuItem, UiDropdownMenuLabel, UiDropdownMenuSeparator, UiDropdownMenuTrigger, UiSidebarGroupLabel, UiSidebarMenuSubItem } from '#components';
// import { useSessionStore } from '~/composables/useSessionStore'
import { Role } from "@prisma/client";
const sessionStore = useSessionStore()
const colorMode = useColorMode()

const changeColors = () => {
	colorMode.preference = colorMode.preference == "light" ? "dark" : "light"
}

// Sidebar structure for clarity and maintainability
interface SidebarItem {
	title: string;
	url?: string;
	icon: string;
	items?: SidebarItem[];
	action?: string;
}
interface SidebarSection {
	label: string | null;
	labelClass?: string;
	adminOnly?: boolean;
	items: SidebarItem[];
}

const sidebarSections: SidebarSection[] = [
	{
		label: null, // Main navigation
		items: [
			{ title: "Home", url: "/", icon: "lucide:home" },
			{
				title: "Koken", url: "/cooking", icon: "lucide:cooking-pot", items: [
					{ title: "Invullen", url: "#", icon: "lucide:dot" },
					{ title: "Aanmaken", url: "/cooking/create", icon: "lucide:dot" },
				]
			},
			{ title: "Calendar", url: "#", icon: "lucide:calendar" },
			{ title: "Search", url: "#", icon: "lucide:search" },
			{ title: "Settings", url: "#", icon: "lucide:settings" },
		]
	},
	{
		label: "Gebruiker",
		labelClass: "text-base font-semibold px-6 pt-4 pb-2", // smaller and less bold
		items: [
			{ title: "Instellingen", url: "/settings", icon: "lucide:user-cog" },
			{ title: "Uitloggen", icon: "lucide:log-out", action: "logout" },
		]
	},
	{
		label: "Site settings",
		labelClass: "text-base font-semibold px-6 pt-4 pb-2",
		adminOnly: true,
		items: [
			{ title: "Site settings", url: "/admin", icon: "lucide:shield-ellipsis" },
		]
	}
];

const visibleSidebarSections = computed(() => {
	const isAdmin = sessionStore!.sessionData!.role == Role.ADMIN;
	return sidebarSections.filter(section => !section.adminOnly || isAdmin)
})

function handleSidebarAction(action: string) {
	if (action === 'logout') {
		sessionStore.signOut({ callbackUrl: '/auth/login' })
	}
}
</script>
