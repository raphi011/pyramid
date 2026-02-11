"use client";

import { useTranslations } from "next-intl";
import { Avatar } from "./components/avatar";
import {
  Dropdown,
  DropdownButton,
  DropdownDivider,
  DropdownItem,
  DropdownLabel,
  DropdownMenu,
} from "./components/dropdown2";
import {
  Navbar,
  NavbarDivider,
  NavbarItem,
  NavbarLabel,
  NavbarSection,
  NavbarSpacer,
} from "./components/navbar";
import {
  Sidebar,
  SidebarBody,
  SidebarHeader,
  SidebarItem,
  SidebarLabel,
  SidebarSection,
} from "./components/sidebar";
import { StackedLayout } from "./components/stacked-layout";
import {
  ArrowRightStartOnRectangleIcon,
  ChevronDownIcon,
  Cog8ToothIcon,
  LightBulbIcon,
  PlusIcon,
  ShieldCheckIcon,
  UserIcon,
} from "@heroicons/react/16/solid";
import { InboxIcon, MagnifyingGlassIcon } from "@heroicons/react/20/solid";

const navItems = [{ label: "Home", url: "/" }];

function LogoutButton() {
  const t = useTranslations("nav");

  return (
    <form action="/api/auth/logout" method="POST" className="w-full">
      <button
        type="submit"
        className="flex w-full items-center gap-3 rounded-lg px-3.5 py-2.5 text-left text-base/6 text-zinc-950 sm:py-2 sm:text-sm/5 data-[focus]:bg-zinc-950/5 dark:text-white dark:data-[focus]:bg-white/5"
      >
        <ArrowRightStartOnRectangleIcon className="size-4" />
        <span>{t("logout")}</span>
      </button>
    </form>
  );
}

interface Player {
  id: number;
  name: string;
  email: string;
}

function TeamDropdownMenu() {
  const t = useTranslations("nav");

  return (
    <DropdownMenu className="min-w-80 lg:min-w-64" anchor="bottom start">
      <DropdownItem href="/teams/1">
        <Avatar slot="icon" src="/tailwind-logo.svg" />
        <DropdownLabel>UTV Obersdorf Herren</DropdownLabel>
      </DropdownItem>
      <DropdownDivider />
      <DropdownItem href="/teams/create">
        <PlusIcon />
        <DropdownLabel>{t("newRanking")}</DropdownLabel>
      </DropdownItem>
    </DropdownMenu>
  );
}

export default function Navigation({
  children,
  currentPlayer,
}: {
  children: React.ReactNode;
  currentPlayer: Player;
}) {
  const t = useTranslations("nav");

  return (
    <StackedLayout
      navbar={
        <Navbar>
          <Dropdown>
            <DropdownButton as={NavbarItem} className="max-md:hidden">
              <Avatar src="/tailwind-logo.svg" />
              <NavbarLabel>Pyramid</NavbarLabel>
              <ChevronDownIcon />
            </DropdownButton>
            <TeamDropdownMenu />
          </Dropdown>
          <NavbarDivider className="max-md:hidden" />
          <NavbarSection className="max-md:hidden">
            {navItems.map(({ label, url }) => (
              <NavbarItem key={label} href={url}>
                {label}
              </NavbarItem>
            ))}
          </NavbarSection>
          <NavbarSpacer />
          <NavbarSection>
            <Dropdown>
              <DropdownButton as={NavbarItem}>
                <Avatar src="/profile-photo.jpg" square />
              </DropdownButton>
              <DropdownMenu className="min-w-64" anchor="bottom end">
                <div className="px-3.5 py-2.5">
                  <p className="text-sm font-medium text-zinc-950 dark:text-white">
                    {currentPlayer.name}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {currentPlayer.email}
                  </p>
                </div>
                <DropdownDivider />
                <DropdownItem href="/my-profile">
                  <UserIcon />
                  <DropdownLabel>{t("myProfile")}</DropdownLabel>
                </DropdownItem>
                <DropdownItem href="/settings">
                  <Cog8ToothIcon />
                  <DropdownLabel>{t("settings")}</DropdownLabel>
                </DropdownItem>
                <DropdownDivider />

                <DropdownItem href="/share-feedback">
                  <LightBulbIcon />
                  <DropdownLabel>{t("feedback")}</DropdownLabel>
                </DropdownItem>
                <DropdownDivider />
                <LogoutButton />
              </DropdownMenu>
            </Dropdown>
          </NavbarSection>
        </Navbar>
      }
      sidebar={
        <Sidebar>
          <SidebarHeader>
            <Dropdown>
              <DropdownButton as={SidebarItem} className="lg:mb-2.5">
                <Avatar src="/tailwind-logo.svg" />
                <SidebarLabel>UTV Obersdorf Herren</SidebarLabel>
                <ChevronDownIcon />
              </DropdownButton>
              <TeamDropdownMenu />
            </Dropdown>
          </SidebarHeader>
          <SidebarBody>
            <SidebarSection>
              {navItems.map(({ label, url }) => (
                <SidebarItem key={label} href={url}>
                  {label}
                </SidebarItem>
              ))}
            </SidebarSection>
          </SidebarBody>
        </Sidebar>
      }
    >
      {children}
    </StackedLayout>
  );
}
