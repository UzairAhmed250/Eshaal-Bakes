import { notFound } from "next/navigation";
import { DevComponentsShowcase } from "@/components/shared/dev-showcase-client";

export const metadata = {
  title: "Component Library Showcase (Dev Only)",
};

export default function DevComponentsPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }
  return <DevComponentsShowcase />;
}
