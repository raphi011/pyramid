import type { Metadata } from "next";
import { JoinFlow } from "./join-flow";

export const metadata: Metadata = { title: "Verein beitreten" };

type JoinPageProps = {
  searchParams: Promise<{ code?: string }>;
};

export default async function JoinPage({ searchParams }: JoinPageProps) {
  const { code } = await searchParams;

  return <JoinFlow initialCode={code?.toUpperCase()} />;
}
