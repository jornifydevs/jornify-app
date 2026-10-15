import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Política de Privacidad | Jornify",
};

export default function PrivacyPolicy() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8"
      >
        ← Volver
      </Link>

      <h1 className="text-3xl font-bold mb-2">Política de Privacidad</h1>
      <p className="text-sm text-muted-foreground mb-10">
        Última actualización: 1 de marzo de 2026
      </p>

      <div className="prose prose-neutral max-w-none space-y-8 text-sm leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold mb-2">
            1. Responsable del tratamiento
          </h2>
          <p>
            <strong>Empresa:</strong> [COMPLETAR: Nombre de la empresa]
            <br />
            <strong>CIF/NIF:</strong> [COMPLETAR: CIF]
            <br />
            <strong>Dirección:</strong> [COMPLETAR: Dirección completa]
            <br />
            <strong>Email de contacto:</strong> [COMPLETAR: email@empresa.com]
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">2. Datos que recogemos</h2>
          <p>
            En el uso de <strong>Jornify</strong> recogemos los siguientes datos
            personales:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Nombre y apellidos</li>
            <li>Dirección de correo electrónico</li>
            <li>DNI/NIE (para identificación laboral)</li>
            <li>Datos de fichaje: horas de entrada, salida y descansos</li>
            <li>Datos de empresa y centro de trabajo</li>
            <li>
              Información de pago (gestionada por Lemon Squeezy — no almacenamos
              datos de tarjeta)
            </li>
            <li>Dirección IP y datos de navegación (cookies técnicas)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">
            3. Finalidad y base legal
          </h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Prestación del servicio</strong> — gestión de fichajes y
              control horario. Base legal: ejecución de contrato (art. 6.1.b
              RGPD).
            </li>
            <li>
              <strong>Facturación y pagos</strong> — procesamiento de
              suscripciones. Base legal: ejecución de contrato.
            </li>
            <li>
              <strong>Comunicaciones del servicio</strong> — notificaciones por
              email sobre la cuenta. Base legal: interés legítimo.
            </li>
            <li>
              <strong>Cumplimiento de obligaciones legales</strong> —
              conservación de registros laborales conforme al Estatuto de los
              Trabajadores. Base legal: obligación legal (art. 6.1.c RGPD).
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">
            4. Proveedores y transferencias internacionales
          </h2>
          <p>
            Trabajamos con los siguientes proveedores, algunos con sede fuera
            del Espacio Económico Europeo (EEE). Todos están acogidos al{" "}
            <em>EU-US Data Privacy Framework</em> o cuentan con cláusulas
            contractuales tipo aprobadas por la Comisión Europea:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>
              <strong>Supabase Inc.</strong> (EE.UU.) — base de datos y
              autenticación
            </li>
            <li>
              <strong>Lemon Squeezy LLC</strong> (EE.UU.) — procesamiento de
              pagos alternativo
            </li>
            <li>
              <strong>Resend Inc.</strong> (EE.UU.) — envío de emails
              transaccionales
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">
            5. Conservación de datos
          </h2>
          <p>
            Los datos se conservan durante el tiempo que dure la relación
            contractual y, una vez finalizada, durante los plazos legales
            aplicables (generalmente 5 años para datos de facturación y 4 años
            para registros laborales según el Estatuto de los Trabajadores).
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">
            6. Derechos del usuario
          </h2>
          <p>
            Puedes ejercer los siguientes derechos enviando un email a{" "}
            <strong>[COMPLETAR: email@empresa.com]</strong>:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>
              <strong>Acceso</strong> — conocer qué datos tenemos sobre ti
            </li>
            <li>
              <strong>Rectificación</strong> — corregir datos inexactos
            </li>
            <li>
              <strong>Supresión</strong> — solicitar la eliminación de tus datos
            </li>
            <li>
              <strong>Portabilidad</strong> — recibir tus datos en formato
              estructurado
            </li>
            <li>
              <strong>Oposición y limitación</strong> — oponerte a ciertos
              tratamientos
            </li>
          </ul>
          <p className="mt-2">
            También puedes presentar una reclamación ante la{" "}
            <strong>Agencia Española de Protección de Datos (AEPD)</strong> en{" "}
            <a href="https://www.aepd.es" className="underline">
              www.aepd.es
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">7. Cookies</h2>
          <p>
            Utilizamos únicamente cookies técnicas necesarias para el
            funcionamiento de la sesión y la autenticación. No utilizamos
            cookies de seguimiento ni publicidad.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">
            8. Cambios en esta política
          </h2>
          <p>
            Podemos actualizar esta política ocasionalmente. Te notificaremos
            por email ante cambios significativos. La fecha de última
            actualización siempre estará visible al inicio de esta página.
          </p>
        </section>
      </div>
    </main>
  );
}
