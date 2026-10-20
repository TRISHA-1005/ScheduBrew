import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Customer Portal | ScheduBrew",
    template: "%s | ScheduBrew",
  },
  description: "Discover shops, browse menus, place orders, track pickups, manage your profile, and explore rewards with ScheduBrew.",
  robots: { index: false, follow: false },
};

export default function CustomerLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
