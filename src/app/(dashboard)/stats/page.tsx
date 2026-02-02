import { redirect } from "next/navigation";
import { createClient } from "~/lib/supabase/server";
import { StatsView } from "~/app/_components/stats-view";
import { HydrateClient } from "~/trpc/server";

export default async function StatsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <HydrateClient>
      <StatsView />
    </HydrateClient>
  );
}
