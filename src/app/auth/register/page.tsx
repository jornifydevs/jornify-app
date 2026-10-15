import type { Metadata } from "next";
import { RegisterForm } from "@/components/RegisterForm";

export const metadata: Metadata = {
  title: "Registro - Jornify",
  description: "Crear una nueva cuenta en Jornify",
  openGraph: {
    title: "Registro | Jornify",
    description: "Crear una nueva cuenta en Jornify",
  },
};

export default function Register() {
  return <RegisterForm />;
}
