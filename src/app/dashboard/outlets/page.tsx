import { prisma } from "@/lib/prisma";
import OutletsView from "./view";

export default async function OutletsPage() {
  const outlets = await prisma.outlet.findMany({ orderBy: { id: "desc" } });

  return <OutletsView outlets={outlets} />;
}
