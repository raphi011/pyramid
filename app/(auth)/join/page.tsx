import { JoinFlow } from "./join-flow";

type JoinPageProps = {
  searchParams: Promise<{ code?: string }>;
};

export default async function JoinPage({ searchParams }: JoinPageProps) {
  const { code } = await searchParams;

  return <JoinFlow initialCode={code?.toUpperCase()} />;
}
