import { redirect } from "next/navigation";
import { createClient } from "~/lib/supabase/server";
import { CalendarView } from "~/app/_components/calendar-view";
import { HydrateClient } from "~/trpc/server";

export default async function CalendarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <HydrateClient>
      <CalendarView />
    </HydrateClient>
  );
}
