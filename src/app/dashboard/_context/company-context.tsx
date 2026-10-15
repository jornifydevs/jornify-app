"use client";

import { createContext, useContext } from "react";

interface CompanyContextValue {
  companyLogo?: string;
}

const CompanyContext = createContext<CompanyContextValue>({});

export function CompanyProvider({
  children,
  companyLogo,
}: {
  children: React.ReactNode;
  companyLogo?: string;
}) {
  return (
    <CompanyContext.Provider value={{ companyLogo }}>
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  return useContext(CompanyContext);
}
