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
										<div v-if="child.sort === SidebarItemType.Divider" class="my-1"></div>
										<UiSidebarMenuSubItem v-else>
											<UiSidebarMenuSubButton as-child class="text-lg">
												<NuxtLink v-if="child.sort === SidebarItemType.Link && child.url"
													:to="child.url" class="text-base">
													<Icon :name="child.icon"
														class="size-6 mr-3 text-primary shrink-0" />
													{{ child.title }}
												</NuxtLink>
												<button v-else-if="child.sort === SidebarItemType.Link && child.action"
													type="button" class="cursor-pointer text-base"
													@click="handleSidebarAction(child.action)">
													<Icon :name="child.icon"
														class="size-6 mr-3 text-primary shrink-0" />
													{{ child.title }}
												</button>
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
						<UserProfilePicture :size="40" />
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
		<UiSidebarInset class="min-w-0">
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
			<div class="w-full min-w-0 p-4 text-foreground max-w-full overflow-x-hidden">
				<slot />
			</div>
		</UiSidebarInset>
	</UiSidebarProvider>
</template>

<script lang="ts" setup>
import { Role } from "@/generated/prisma/browser";
const sessionStore = useSessionStore()
const colorMode = useColorMode()
const pageInfoStore = usePageInfoStore();

const changeColors = () => {
	colorMode.preference = colorMode.preference == "light" ? "dark" : "light"
}

enum SidebarItemType {
	Link,
	Divider
}

// Sidebar structure for clarity and maintainability
interface SidebarItemBase {
	sort: SidebarItemType,
	role?: Role;
}

interface SidebarLink extends SidebarItemBase {
	sort: SidebarItemType.Link
	title: string;
	url?: string;
	icon: string;
	action?: "logout";
}

interface SidebarDivider extends SidebarItemBase {
	sort: SidebarItemType.Divider
}

type SidebarItem = SidebarLink | SidebarDivider;

interface SidebarSection {
	label: string;
	items: SidebarItem[];
}

const sidebarSections: SidebarSection[] = [
	{
		label: 'Algemeen', // Main navigation
		items: [
			{ sort: SidebarItemType.Link, title: "Dashboard", url: "/", icon: "lucide:home" },
			{ sort: SidebarItemType.Link, title: "Geluid", url: "/device", icon: "lucide:speaker"}
		]
	},
	{
		label: 'Koken',
		items: [
			{ sort: SidebarItemType.Link, title: "Schema", url: "/cooking", icon: "lucide:cooking-pot" },
			{ sort: SidebarItemType.Link, title: "Punten", url: "/cooking/overview", icon: "lucide:chart-no-axes-combined" },
			{ sort: SidebarItemType.Link, title: "Invullen", url: "/cooking/fill", icon: "lucide:calendar-search" },
			{ sort: SidebarItemType.Divider, role: Role.COOKING },
			{ sort: SidebarItemType.Link, title: "Beheren", url: "/cooking/points", icon: "lucide:cog", role: Role.COOKING },
			{ sort: SidebarItemType.Link, title: "Aanmaken", url: "/cooking/create", icon: "lucide:calendar-cog", role: Role.COOKING },
			{ sort: SidebarItemType.Link, title: "Indelen", url: "/cooking/manage-month", icon: "lucide:calendar-range", role: Role.COOKING }
		]
	},
	{
		label: "Afwassen",
		items: [
			{ sort: SidebarItemType.Link, title: "Invullen", url: "/washing/fill", icon: "lucide:bubbles" },
			{ sort: SidebarItemType.Link, title: "Overzicht", url: "/washing", icon: "lucide:sheet" },
			{ sort: SidebarItemType.Link, title: "Penalty", url: "/washing/penalty", icon: "lucide:diff" }
		]
	},
	{
		label: "Ik",
		items: [
			{ sort: SidebarItemType.Link, title: "Instellingen", url: "/settings", icon: "lucide:user-cog" },
			{ sort: SidebarItemType.Link, title: "Uitloggen", icon: "lucide:log-out", action: "logout" },
		]
	},
	{
		label: "Tools",
		items: [
			{ sort: SidebarItemType.Link, title: "Admin", url: "/admin", icon: "lucide:shield-ellipsis", role: Role.ADMIN },
			{ sort: SidebarItemType.Link, title: "Saaien", url: "/admin/absences", icon: "lucide:parasol", role: Role.ADMIN },
		]
	}
];

const visibleSidebarSections = computed(() => {
	return sidebarSections
		.map(section => {
			const filteredItems = section.items.filter(item => {
				// Admins can see everything
				if (sessionStore!.sessionData!.roles.includes(Role.ADMIN)) {
					return true;
				}
				return !item.role || sessionStore!.sessionData!.roles.includes(item.role);
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
