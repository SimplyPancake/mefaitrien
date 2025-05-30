<template>
	<UiSidebarProvider>
		<UiSidebar>
			<UiSidebarContent class="flex flex-col h-full">
				<!-- Header section -->
				<UiSidebarGroup class="pb-2">
					<div class="flex items-center gap-3 px-4">
						<UiAvatar src="/img/logo.png" class="size-12 rounded-none" />
						<div class="text-xl font-bold text-sidebar-foreground">
							Me Fait Rien
						</div>
					</div>
				</UiSidebarGroup>

				<UiSidebarGroup>
					<UiDivider class="text-primary" />
				</UiSidebarGroup>

				<!-- Sidebar sections -->
				<UiSidebarGroup>
					<UiSidebarGroupContent>
						<UiSidebarMenu>
							<UiSidebarMenuItem v-for="(section, sIdx) in visibleSidebarSections" :key="sIdx"
								class="pb-4">
								<!-- <UiSidebarMenuItem v-for="item in section.items" :key="item.title"> -->
								<UiSidebarMenuButton as-child>
									<NuxtLink class="text-xl font-semibold">
										{{ section.label }}
									</NuxtLink>
								</UiSidebarMenuButton>
								<UiSidebarMenuSub>
									<template v-for="(child, k) in section.items" :key="`child-${k}`">
										<UiSidebarMenuSubItem>
											<UiSidebarMenuSubButton as-child class="text-lg">
												<NuxtLink v-if="child.url" :href="child.url" class="text-base">
													<Icon :name="child.icon"
														class="size-6 mr-3 text-primary shrink-0" />
													{{ child.title }}
												</NuxtLink>
												<NuxtLink v-if="child.action" class="cursor-pointer text-base"
													@click="child.action && handleSidebarAction(child.action)">
													<Icon :name="child.icon"
														class="size-6 mr-3 text-primary shrink-0" />
													{{ child.title }}
												</NuxtLink>
											</UiSidebarMenuSubButton>
										</UiSidebarMenuSubItem>
									</template>
								</UiSidebarMenuSub>
							</UiSidebarMenuItem>
						</UiSidebarMenu>
					</UiSidebarGroupContent>
				</UiSidebarGroup>

				<!-- Sidebar footer -->
				<UiSidebarFooter class="mt-auto px-4 py-4 border-t border-sidebar-border">
					<div class="flex items-center gap-3">
						<UiAvatar src="/img/dannyprofielfoto.png" class="size-10" />
						<div class="flex-1 min-w-0">
							<div class="text-lg font-medium truncate">{{ sessionStore!.sessionData!.name || '' }}
							</div>
							<div class="text-muted-foreground truncate">{{
								sessionStore!.sessionData!.cookingGroup || 'Geen kookgroep' }}</div>
						</div>
						<UiButton size="icon" variant="ghost"
							class="ml-auto hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground"
							@click="changeColors">
							<Icon class="size-6" name="lucide:paintbrush" />
						</UiButton>
					</div>
				</UiSidebarFooter>
			</UiSidebarContent>
		</UiSidebar>
		<UiSidebarInset>
			<UiNavbar sticky class="h-20 px-6 bg-card text-sidebar-primary shadow-md">
				<div class="flex items-center gap-4 h-full">
					<UiSidebarTrigger class="text-primary p-2 shrink-0 w-10 h-10" />
					<div class="flex flex-col">
						<p class="text-xl text-foreground font-bold">
							{{ pageInfoStore.title }}
						</p>
						<!-- <span class="text-muted-foreground">
							{{ pageInfoStore.subtitle }}
						</span> -->
					</div>
				</div>
			</UiNavbar>
			<div class="p-4 text-foreground max-w-full overflow-x-hidden">
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
const pageInfoStore = usePageInfoStore();

const changeColors = () => {
	colorMode.preference = colorMode.preference == "light" ? "dark" : "light"
}

// Sidebar structure for clarity and maintainability
interface SidebarItem {
	title: string;
	url?: string;
	icon: string;
	role?: string;
	action?: string;
}
interface SidebarSection {
	label: string | null;
	items: SidebarItem[];
}

const sidebarSections: SidebarSection[] = [
	{
		label: 'Algemeen', // Main navigation
		items: [
			{ title: "Dashboard", url: "/", icon: "lucide:home" },
			{ title: "Koken", url: "/cooking", icon: "lucide:cooking-pot" },
			{ title: "Invullen", url: "/cooking/fill", icon: "lucide:calendar-search" },
			{ title: "Punten", url: "#", icon: "lucide:chart-no-axes-combined" },
		]
	},
	{
		label: "Gebruiker",
		items: [
			{ title: "Instellingen", url: "/settings", icon: "lucide:user-cog" },
			{ title: "Uitloggen", icon: "lucide:log-out", action: "logout" },
		]
	},
	{
		label: "Tools",
		items: [
			{ title: "Admin", url: "/admin", icon: "lucide:shield-ellipsis", role: "ADMIN" },
			{ title: "Aanmaken", url: "/cooking/create", icon: "lucide:calendar-cog", role: "ADMIN" },
		]
	}
];

const visibleSidebarSections = computed(() => {
	return sidebarSections
		.map(section => {
			const filteredItems = section.items.filter(item => {
				// Admins can see everything
				if (sessionStore!.sessionData!.role === "ADMIN") {
					return true;
				}
				// If the item has no role or matches the user's role, include it
				return !item.role || item.role === sessionStore!.sessionData!.role;
			});

			// Only return sections that have visible items
			if (filteredItems.length > 0) {
				return {
					...section,
					items: filteredItems,
				};
			}

			return null;
		})
		.filter(Boolean); // Remove null sections
});

function handleSidebarAction(action: string) {
	if (action === 'logout') {
		sessionStore.signOut({ callbackUrl: '/auth/login' })
	}
}
</script>
