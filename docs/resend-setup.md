# Resend — Guía de configuración

## Archivos relevantes

| Archivo                                           | Qué hace                                       |
| ------------------------------------------------- | ---------------------------------------------- |
| `src/infrastructure/email/resend.adapter.ts`      | Implementación de `EmailService` usando Resend |
| `src/core/domain/ports/services/email.service.ts` | Interfaz del puerto de email                   |
| `src/config.ts`                                   | `config.email.from` — dirección de remitente   |

---

## Pasos pendientes

### 1. Crear cuenta

- Regístrate en https://resend.com

### 2. Verificar dominio

- **Domains → Add Domain** → añade `jornify.com`
- Resend te dará registros DNS (TXT + MX) que hay que añadir en tu proveedor de dominio
- Una vez verificado, el remitente `Jornify <noreply@jornify.com>` ya está en `src/config.ts`

### 3. Crear API Key

- **API Keys → Create API Key**
- Permiso mínimo: **Sending access**
- Anota la clave → `RESEND_API_KEY`

### 4. Variables de entorno

En `.env.local` (local) y en **Vercel → Settings → Environment Variables** (producción):

```
RESEND_API_KEY=re_...
```

### 5. Probar en local

Resend permite enviar emails reales desde local siempre que el dominio esté verificado.
Para pruebas sin dominio verificado, usa `onboarding@resend.dev` como remitente (solo hacia tu propio email).
