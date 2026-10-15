import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Términos de Servicio | Jornify",
};

export default function TermsOfService() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8"
      >
        ← Volver
      </Link>

      <h1 className="text-3xl font-bold mb-2">Términos de Servicio</h1>
      <p className="text-sm text-muted-foreground mb-10">
        Última actualización: 1 de marzo de 2026
      </p>

      <div className="prose prose-neutral max-w-none space-y-8 text-sm leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold mb-2">
            1. Identificación del prestador
          </h2>
          <p>
            <strong>Empresa:</strong> [COMPLETAR: Nombre de la empresa]
            <br />
            <strong>CIF/NIF:</strong> [COMPLETAR: CIF]
            <br />
            <strong>Dirección:</strong> [COMPLETAR: Dirección completa]
            <br />
            <strong>Email:</strong> [COMPLETAR: email@empresa.com]
          </p>
          <p className="mt-2">
            El uso de <strong>Jornify</strong> implica la aceptación plena de
            estos términos. Si no estás de acuerdo, no utilices el servicio.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">
            2. Descripción del servicio
          </h2>
          <p>
            Jornify es una aplicación SaaS de gestión de fichajes y control
            horario laboral. Permite a las empresas registrar entradas y salidas
            de trabajadores, gestionar jornadas y generar informes de
            asistencia.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">
            3. Acceso y cuenta de usuario
          </h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>El acceso requiere registro con email y contraseña válidos.</li>
            <li>
              Eres responsable de mantener la confidencialidad de tus
              credenciales.
            </li>
            <li>
              Debes notificarnos inmediatamente ante cualquier acceso no
              autorizado.
            </li>
            <li>
              Nos reservamos el derecho de suspender cuentas que incumplan estos
              términos.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">4. Suscripción y pagos</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              El servicio se ofrece mediante suscripción con facturación mensual
              o anual.
            </li>
            <li>
              Los pagos se procesan de forma segura a través de{" "}
              <strong>Stripe</strong> o <strong>Lemon Squeezy</strong>. No
              almacenamos datos de tarjeta de crédito.
            </li>
            <li>
              Los precios incluyen IVA aplicable según la legislación española.
            </li>
            <li>
              La suscripción se renueva automáticamente salvo que la canceles
              antes del siguiente ciclo.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">
            5. Cancelación y reembolsos
          </h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              Puedes cancelar tu suscripción en cualquier momento desde los
              ajustes de tu cuenta.
            </li>
            <li>
              Al cancelar, mantendrás el acceso hasta el final del período ya
              pagado.
            </li>
            <li>
              Ofrecemos reembolso completo durante los primeros{" "}
              <strong>14 días</strong> desde la primera contratación si el
              servicio no cumple tus expectativas. Solicítalo en [COMPLETAR:
              email@empresa.com].
            </li>
            <li>
              No se realizan reembolsos parciales por períodos no utilizados
              tras los 14 días iniciales.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">6. Uso aceptable</h2>
          <p>Queda prohibido:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Usar el servicio para fines ilegales o fraudulentos.</li>
            <li>Intentar acceder a datos de otras empresas o usuarios.</li>
            <li>
              Realizar ingeniería inversa, descompilar o modificar el software.
            </li>
            <li>
              Revender o sublicenciar el acceso a terceros sin autorización
              escrita.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">
            7. Disponibilidad y mantenimiento
          </h2>
          <p>
            Nos esforzamos por mantener el servicio disponible 24/7, pero no
            garantizamos una disponibilidad ininterrumpida. Podemos realizar
            mantenimientos programados con aviso previo. No somos responsables
            de interrupciones causadas por terceros (Supabase, proveedores de
            red, etc.).
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">
            8. Propiedad intelectual
          </h2>
          <p>
            Todos los derechos sobre el software, diseño y marca de Jornify
            pertenecen a [COMPLETAR: Nombre de la empresa]. Los datos
            introducidos por los usuarios (fichajes, empleados, etc.) son
            propiedad del cliente.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">
            9. Limitación de responsabilidad
          </h2>
          <p>
            En ningún caso seremos responsables por daños indirectos, pérdida de
            beneficios o datos derivados del uso o imposibilidad de uso del
            servicio. Nuestra responsabilidad máxima se limita al importe pagado
            por el cliente en los últimos 12 meses.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">
            10. Ley aplicable y jurisdicción
          </h2>
          <p>
            Estos términos se rigen por la legislación española. Para cualquier
            controversia, las partes se someten a los juzgados y tribunales de{" "}
            <strong>[COMPLETAR: ciudad]</strong>, salvo que la normativa de
            consumidores establezca otro fuero.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">11. Modificaciones</h2>
          <p>
            Podemos modificar estos términos notificándote por email con al
            menos 15 días de antelación. El uso continuado del servicio tras esa
            fecha implica la aceptación de los nuevos términos.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">12. Contacto</h2>
          <p>
            Para cualquier consulta sobre estos términos, escríbenos a{" "}
            <strong>[COMPLETAR: email@empresa.com]</strong>.
          </p>
        </section>
      </div>
    </main>
  );
}
