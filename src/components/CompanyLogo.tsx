"use client";

import Image from "next/image";
import { useCompany } from "@/app/dashboard/_context/company-context";

export default function CompanyLogo() {
  const { companyLogo } = useCompany();

  if (!companyLogo) return null;

  return (
    <Image
      src={companyLogo}
      alt="Logo de empresa"
      width={40}
      height={40}
      className="rounded-lg object-contain"
    />
  );
}
