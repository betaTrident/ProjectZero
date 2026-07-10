export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="app-surface min-h-screen bg-background text-foreground">{children}</div>;
}
