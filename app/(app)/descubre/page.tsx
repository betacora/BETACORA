import { DescubreClient } from "@/components/DescubreClient";
import { fetchDiscoverFeed } from "@/lib/shared-trips-feed";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Public feed of opt-in shared trips (show_in_feed = true only). */
export default async function DescubrePage() {
  const trips = await fetchDiscoverFeed(24);
  return <DescubreClient trips={trips} />;
}
