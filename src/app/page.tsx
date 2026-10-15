import { redirect } from "next/navigation";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gestión de Horarios Laborales",
  description: "Sistema de registro y control de horarios de trabajo",
};

export default function Home() {
  redirect("/auth/login");
}
