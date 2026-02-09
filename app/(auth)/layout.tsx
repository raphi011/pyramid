export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 py-12 dark:bg-zinc-900">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
            Pyramid
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Tennis Rangliste
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
