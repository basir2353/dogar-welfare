type Props = {
  title: string;
  subtitle?: string;
};

export function AdminPageHeader({ title, subtitle }: Props) {
  return (
    <header className="mb-8">
      <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">{title}</h1>
      {subtitle ? <p className="mt-2 max-w-3xl text-sm leading-relaxed text-subtle">{subtitle}</p> : null}
    </header>
  );
}
