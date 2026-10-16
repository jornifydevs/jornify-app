import { createClient } from "@/infrastructure/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SupabaseUserRepository } from "@/infrastructure/supabase/repositories/supabase-user.repository";
import { SupabaseWorkerRepository } from "@/infrastructure/supabase/repositories/supabase-worker.repository";
import { SupabaseDocumentRepository } from "@/infrastructure/supabase/repositories/supabase-document.repository";
import ProfileView from "./_components/ProfileView";

export default async function ProfilePage() {
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const userRepo = new SupabaseUserRepository(supabase);
  const userData = await userRepo.findByEmail(user.email!);

  if (!userData) {
    redirect("/auth/login");
  }

  const workerRepo = new SupabaseWorkerRepository(supabase);
  const documentRepo = new SupabaseDocumentRepository(supabase);

  const worker = await workerRepo.findByUserId(userData.id);
  const userImg = worker
    ? await documentRepo.findAvatarUrlByWorkerId(worker.id)
    : undefined;

  return (
    <ProfileView
      userId={userData.id}
      workerId={worker?.id}
      initialName={userData.name}
      initialLastName={userData.lastName}
      initialEmail={userData.email}
      initialPhone={userData.phone ?? ""}
      userImg={userImg}
    />
  );
}
