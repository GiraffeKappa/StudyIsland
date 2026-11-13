import StudyIsland from "@/components/StudyIsland";
import type { Metadata } from "next";
export const dynamic = "force-dynamic";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ access: string }>;
}): Promise<Metadata> {
  const { access } = await params;
  return {
    manifest: "/island/" + encodeURIComponent(access) + "/manifest.webmanifest",
    robots: { index: false, follow: false },
    referrer: "no-referrer",
  };
}
export default function FamilyIsland() {
  return <StudyIsland />;
}
