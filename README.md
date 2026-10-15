# ⚡ Jornify - Gestión de Horarios Laborales

Sistema de gestión y control de horarios laborales construido con Next.js, Supabase y tecnologías modernas.

## 🎯 Características

- ✅ **Autenticación de usuarios** con Supabase Auth
- ⏰ **Registro de entrada/salida** en tiempo real
- 📊 **Historial de horarios** con filtros personalizables
- 👥 **Panel de administración** con estadísticas
- 📱 **Diseño responsivo** y moderno
- 🔐 **Seguridad** con Row Level Security

## 🚀 Inicio Rápido

### Desarrollo Local (sin Docker)

```bash
# Instalar dependencias
pnpm install

# Configurar variables de entorno
cp .env.example .env.local
# Edita .env.local con tus credenciales de Supabase

# Ejecutar en modo desarrollo
pnpm dev

# Ejecutar tests
pnpm test
```

La aplicación estará disponible en `http://localhost:3000`

### Con Docker (Opcional)

```bash
# Desarrollo con PostgreSQL
docker-compose -f docker/dev/docker-compose.yml -f docker/dev/docker-compose.postgres.yml up --build

# Producción
docker-compose -f docker/prod/docker-compose.yml -f docker/prod/docker-compose.postgres.yml up --build -d
```

## ⚙️ Configuración

### Variables de Entorno

Crea un archivo `.env.local` con:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key

# Opcional: PostgreSQL local (si usas Docker)
# DATABASE_URL=postgresql://devuser:devpass@postgres:5432/jornifydev
```

### Base de Datos

El sistema utiliza las siguientes tablas en Supabase:

- `users` - Información de usuarios
- `company` - Empresas
- `center` - Centros de trabajo
- `worker` - Trabajadores
- `workday` - Jornadas laborales
- `time_record` - Registros de entrada/salida

## 👥 Roles de Usuario

### Administrador

- Vista de estadísticas generales
- Gestión de trabajadores y centros
- Reportes de horarios

### Trabajador

- Registro de entrada/salida
- Visualización de historial personal
- Cálculo automático de horas trabajadas

## 🛠️ Stack Tecnológico

- **Framework**: Next.js 16 con App Router y Turbopack
- **Lenguaje**: TypeScript (strict mode)
- **Base de Datos**: Supabase (PostgreSQL)
- **Autenticación**: Supabase Auth
- **Estilos**: Tailwind CSS
- **UI Components**: shadcn/ui (Radix UI)
- **Animaciones**: Framer Motion
- **Iconos**: Lucide React
- **Pagos**: Stripe, Lemon Squeezy
- **Email**: Mailgun
- **Testing**: Vitest
- **Package Manager**: pnpm

## 🏗️ Arquitectura

El proyecto sigue una **arquitectura hexagonal** (Ports & Adapters) con 4 capas bien definidas:

```
src/
├── core/                          # Logica de negocio pura
│   ├── domain/
│   │   ├── entities/              # Interfaces de entidades (camelCase)
│   │   ├── ports/
│   │   │   ├── repositories/      # Contratos de repositorios
│   │   │   └── services/          # Contratos de servicios externos
│   │   └── errors/                # Jerarquia de errores de dominio
│   └── application/
│       ├── use-cases/             # Casos de uso (1 clase por operacion)
│       └── dtos/                  # Data transfer objects
│
├── infrastructure/                # Implementaciones de los puertos
│   ├── supabase/                  # Cliente, middleware y repositorios
│   ├── email/                     # Adaptador Mailgun
│   └── payment/                   # Adaptadores Stripe y Lemon Squeezy
│
├── app/                           # Next.js App Router (presentacion)
│   ├── dashboard/
│   │   ├── _components/           # Componentes UI (solo renderizado)
│   │   └── _hooks/                # Hooks personalizados (UI ↔ use cases)
│   ├── auth/                      # Autenticacion
│   └── api/                       # API routes
│
├── components/                    # Componentes compartidos (shadcn/ui)
└── __tests__/                     # Tests unitarios
```

**Regla principal**: Las dependencias siempre fluyen hacia dentro: `app → infrastructure → application → domain`.

## 🧪 Testing

```bash
# Ejecutar todos los tests
pnpm test

# Watch mode
pnpm test:watch

# Con cobertura
pnpm test:coverage
```

Los tests unitarios cubren los casos de uso (`src/__tests__/core/application/use-cases/`) usando mocks de los puertos de repositorio.

## 📖 Uso

### Como Trabajador

1. Inicia sesión con tus credenciales
2. En el dashboard, haz clic en "Marcar Entrada"
3. El sistema registra automáticamente la hora
4. Al finalizar, haz clic en "Marcar Salida"
5. Revisa tu historial en la sección inferior

### Como Administrador

1. Inicia sesión con credenciales de administrador
2. Visualiza estadísticas del sistema
3. Gestiona trabajadores y centros (próximamente)

## 🔒 Seguridad

- Autenticación mediante Supabase Auth
- Row Level Security (RLS) en todas las tablas
- Los usuarios solo pueden ver sus propios registros
- Validación de permisos en servidor y cliente

## 📝 Licencia

Este proyecto está bajo la licencia MIT.

---

Desarrollado con ❤️ para la gestión eficiente de horarios laborales
