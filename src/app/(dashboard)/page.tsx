import { redirect } from "next/navigation";
import { createClient } from "~/lib/supabase/server";
import { TodoList } from "~/app/_components/todo-list";
import { HydrateClient } from "~/trpc/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <HydrateClient>
      <TodoList />
    </HydrateClient>
  );
}
