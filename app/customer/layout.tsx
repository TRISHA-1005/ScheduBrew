import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Customer Portal | ScheduBrew",
    template: "%s | ScheduBrew",
  },
  description: "ScheduBrew customer frontend preview for shop discovery, menu browsing, demonstration checkout, order tracking, profile, and rewards.",
  robots: { index: false, follow: false },
};

export default function CustomerLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
