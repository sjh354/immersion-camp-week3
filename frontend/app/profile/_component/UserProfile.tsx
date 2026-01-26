interface UserProfileProps {
  name: string;
  status: string;
}

export function UserProfile({ name, status }: UserProfileProps) {
  return (
    <section className="rounded-2xl border border-border bg-card p-6">
      <h2 className="text-lg font-semibold">{name}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{status}</p>
    </section>
  );
}
