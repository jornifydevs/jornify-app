import { createClient } from "@/infrastructure/supabase/server";
import { cookies } from "next/headers";
import { CompanyProvider } from "./_context/company-context";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let companyLogo: string | undefined;

  if (user) {
    const { data: userData } = await supabase
      .from("users")
      .select("company_id")
      .eq("email", user.email!)
      .single();

    if (userData?.company_id) {
      const { data: company } = await supabase
        .from("company")
        .select("logo")
        .eq("id", userData.company_id)
        .single();

      if (company?.logo) {
        const { data: urlData } = supabase.storage
          .from("Avatars")
          .getPublicUrl(company.logo);
        companyLogo = urlData.publicUrl;
      }
    }
  }

  return (
    <CompanyProvider companyLogo={companyLogo}>{children}</CompanyProvider>
  );
}
