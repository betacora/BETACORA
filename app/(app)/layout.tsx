import { AppShell } from "@/components/AppShell";

export default function AppTabsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
