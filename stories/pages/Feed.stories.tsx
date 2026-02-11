"use client";

import type { Meta, StoryObj } from "@storybook/react";
import { BellIcon } from "@heroicons/react/24/outline";
import { PageWrapper } from "./_page-wrapper";
import { PageLayout } from "@/components/page-layout";
import { Tabs } from "@/components/ui/tabs";
import { EventTimeline } from "@/components/domain/event-timeline";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/empty-state";
import { feedEvents, notifications, type Notification } from "./_mock-data";

const meta: Meta = {
  title: "Pages/Neuigkeiten",
  parameters: { layout: "fullscreen" },
};

export default meta;
type Story = StoryObj;

// ── Feed tab content ────────────────────────

function FeedContent({ events = feedEvents, loading = false }: { events?: typeof feedEvents; loading?: boolean }) {
  return (
    <div className="space-y-4">
      <EventTimeline events={events} loading={loading} />
      {events.length > 0 && !loading && (
        <Button variant="ghost" className="w-full">
          Mehr laden...
        </Button>
      )}
    </div>
  );
}

// ── Notifications tab content ───────────────

function NotificationItem({ item }: { item: Notification }) {
  return (
    <button className="flex w-full items-start gap-3 px-1 py-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50">
      <div className="relative">
        <Avatar name={item.avatarName} size="sm" />
        {!item.read && (
          <span className="absolute -left-1 top-0 size-2 rounded-full bg-court-500" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-900 dark:text-white">
          {item.title}
        </p>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
          {item.description}
        </p>
        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
          {item.timestamp}
        </p>
      </div>
    </button>
  );
}

function NotificationSection({ title, items }: { title: string; items: Notification[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <h2 className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
        {title}
      </h2>
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {items.map((n) => (
          <NotificationItem key={n.id} item={n} />
        ))}
      </div>
    </div>
  );
}

function NotificationsContent({ items = notifications }: { items?: Notification[] }) {
  const unread = items.filter((n) => !n.read);
  const read = items.filter((n) => n.read);

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<BellIcon />}
        title="Keine Benachrichtigungen"
        description="Du bist auf dem neuesten Stand."
      />
    );
  }

  return (
    <div className="space-y-6">
      <NotificationSection title="Neu" items={unread} />
      <NotificationSection title="Früher" items={read} />
    </div>
  );
}

// ── Merged page ─────────────────────────────

const unreadCount = notifications.filter((n) => !n.read).length;

function NeuigkeitenPage() {
  return (
    <PageWrapper activeHref="/neuigkeiten">
      <PageLayout
        title="Neuigkeiten"
        action={
          unreadCount > 0 ? (
            <Button variant="ghost" size="sm">
              Alle gelesen
            </Button>
          ) : undefined
        }
      >
        <Tabs
          items={[
            {
              label: "Feed",
              content: (
                <Tabs
                  items={[
                    { label: "Alle Vereine", content: <FeedContent /> },
                    { label: "TC Musterstadt", content: <FeedContent events={feedEvents.slice(0, 5)} /> },
                    { label: "SC Grünwald", content: <FeedContent events={feedEvents.slice(5)} /> },
                  ]}
                />
              ),
            },
            {
              label: `Benachrichtigungen (${unreadCount})`,
              content: <NotificationsContent />,
            },
          ]}
        />
      </PageLayout>
    </PageWrapper>
  );
}

export const Default: Story = {
  render: () => <NeuigkeitenPage />,
};

export const Loading: Story = {
  render: () => (
    <PageWrapper activeHref="/neuigkeiten">
      <PageLayout title="Neuigkeiten">
        <FeedContent events={[]} loading />
      </PageLayout>
    </PageWrapper>
  ),
};

export const EmptyFeed: Story = {
  render: () => (
    <PageWrapper activeHref="/neuigkeiten">
      <PageLayout title="Neuigkeiten">
        <Tabs
          items={[
            { label: "Feed", content: <FeedContent events={[]} /> },
            { label: "Benachrichtigungen", content: <NotificationsContent /> },
          ]}
        />
      </PageLayout>
    </PageWrapper>
  ),
};

export const EmptyNotifications: Story = {
  render: () => (
    <PageWrapper activeHref="/neuigkeiten">
      <PageLayout title="Neuigkeiten">
        <Tabs
          items={[
            { label: "Feed", content: <FeedContent /> },
            { label: "Benachrichtigungen", content: <NotificationsContent items={[]} /> },
          ]}
        />
      </PageLayout>
    </PageWrapper>
  ),
};

export const AllRead: Story = {
  render: () => (
    <PageWrapper activeHref="/neuigkeiten">
      <PageLayout title="Neuigkeiten">
        <Tabs
          items={[
            { label: "Feed", content: <FeedContent /> },
            {
              label: "Benachrichtigungen",
              content: (
                <NotificationsContent
                  items={notifications.map((n) => ({ ...n, read: true }))}
                />
              ),
            },
          ]}
        />
      </PageLayout>
    </PageWrapper>
  ),
};
