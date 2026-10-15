# Lemon Squeezy — Guía de configuración

## Archivos relevantes

| Archivo                                                                        | Qué hace                                                      |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------- |
| `src/infrastructure/payment/lemon-squeezy.adapter.ts`                          | Crea sesiones de checkout, pasa `company_id` como custom data |
| `src/app/api/lemonsqueezy/webhook/route.ts`                                    | Recibe eventos, valida firma HMAC, ejecuta use case           |
| `src/app/api/billing/checkout/route.ts`                                        | Endpoint que el frontend llama para obtener la URL de pago    |
| `src/core/application/use-cases/billing/`                                      | Los 3 use cases: checkout, get-subscription, process-webhook  |
| `src/infrastructure/supabase/repositories/supabase-subscription.repository.ts` | Acceso a tabla `subscription`                                 |
| `supabase/migrations/20260418120000_subscriptions.sql`                         | ✅ Ya aplicada                                                |

---

## Pasos pendientes

### 1. Crear cuenta y tienda

- Regístrate en https://app.lemonsqueezy.com
- Crea una **Store** con el nombre del SaaS

### 2. Crear producto y variante

- **Products → New Product** → tipo **Subscription**
- Crea al menos una variante (ej. "Pro mensual")
- Anota el **Variant ID** — se necesita para `LEMON_SQUEEZY_VARIANT_ID`

### 3. Obtener claves API

- **Settings → API** → genera una API Key → `LEMON_SQUEEZY_API_KEY`
- **Settings → Stores** → copia el Store ID → `LEMON_SQUEEZY_STORE_ID`

### 4. Configurar el webhook

- **Settings → Webhooks → Add webhook**
- URL: `https://tu-dominio.vercel.app/api/lemonsqueezy/webhook`
- Genera un **Signing Secret** → `LEMON_SQUEEZY_WEBHOOK_SECRET`
- Activar estos eventos:
  - `subscription_created`
  - `subscription_updated`
  - `subscription_cancelled`
  - `subscription_resumed`
  - `subscription_expired`
  - `subscription_paused`
  - `subscription_unpaused`
  - `subscription_payment_failed`

### 5. Variables de entorno

En `.env.local` (local) y en **Vercel → Settings → Environment Variables** (producción):

```
LEMON_SQUEEZY_API_KEY=
LEMON_SQUEEZY_STORE_ID=
LEMON_SQUEEZY_WEBHOOK_SECRET=
LEMON_SQUEEZY_VARIANT_ID=
```

### 6. Probar en local con ngrok

Usa el **Test Mode** de LS (toggle arriba a la derecha) para no hacer cobros reales.

```bash
ngrok http 3000
# Usa la URL de ngrok como webhook URL en LS para recibir eventos en local
```

---

## Pendiente de implementar

- [ ] Gate de features por `subscription.status` (bloquear funcionalidades si no hay suscripción activa)
- [ ] Añadir plan `pro` a `src/core/domain/entities/plan.ts` con el Variant ID real
