## [2.10.0](https://github.com/jornifydevs/jornify-app/compare/v2.9.0...v2.10.0) (2026-10-16)

### Features

- **admin:** restyle admin home, company, billing and super admin ([07ed76b](https://github.com/jornifydevs/jornify-app/commit/07ed76b3380c3720e9c57dc16276f5fde60aa7dd))
- **admin:** restyle centers, shifts and reports ([e01b3e6](https://github.com/jornifydevs/jornify-app/commit/e01b3e62f98277e1ecfe063665c12aaa82ae7d2d))
- **admin:** restyle team screens ([1739328](https://github.com/jornifydevs/jornify-app/commit/17393282c3d44d2faf5738bdd5fb79a366a182ad))
- **auth:** restyle login and registration ([7d6d2ef](https://github.com/jornifydevs/jornify-app/commit/7d6d2ef877d8ac818800c31b659f9df60fb3e77c))
- **dashboard:** add worker tab bar and admin sidebar ([934e23a](https://github.com/jornifydevs/jornify-app/commit/934e23ab645d4b06f8a1fc23adff240e62028bdf))
- **dashboard:** move every page to the shared page header ([ad16259](https://github.com/jornifydevs/jornify-app/commit/ad162599fb9581388b1fb39314b0aeabcc88b502))
- **dashboard:** redesign the clock-in screen ([0ee4d9c](https://github.com/jornifydevs/jornify-app/commit/0ee4d9cacad1ba1cb8ca1236eb55fd0a65340737))
- **dashboard:** restyle worker screens ([6f13dfe](https://github.com/jornifydevs/jornify-app/commit/6f13dfe88f6c4eef329be8b2a808666d5ad67264))
- **i18n:** add screen copy and use sentence case in spanish ([dd651c5](https://github.com/jornifydevs/jornify-app/commit/dd651c56a4923d461da235887d08ecb586dfbfc5))
- **time-tracking:** compute workday timeline segments ([61776cb](https://github.com/jornifydevs/jornify-app/commit/61776cb8991867121e245d6866824dba955ce9c3))
- **ui:** add alert, native select and textarea primitives ([42a25c2](https://github.com/jornifydevs/jornify-app/commit/42a25c28aa036a7c56587bf8d49330c1f114bb21))
- **ui:** add jornify logo to auth screens ([27a0567](https://github.com/jornifydevs/jornify-app/commit/27a0567ff5f868fb0567c621ca75443d0fe7013b))
- **ui:** follow the system theme by default ([7e1b0c2](https://github.com/jornifydevs/jornify-app/commit/7e1b0c22e3c1fb6a964a83ea113e5bbfc662007e))
- **ui:** introduce oklch design tokens and geist typography ([0b81cc3](https://github.com/jornifydevs/jornify-app/commit/0b81cc3b5f5d0eb573e5abd9f149c917e6895f3e))
- **ui:** restyle base components and add status badge ([22a992b](https://github.com/jornifydevs/jornify-app/commit/22a992bfd126a321fa707342580f03d064457f17))

### Bug Fixes

- **config:** allow images from the configured supabase storage ([165ca82](https://github.com/jornifydevs/jornify-app/commit/165ca82ba57766415b5accbb4dcda8ad8ba629ca))

## 2.9.0 (2026-04-18)

### Features

- añadir cómputo total de horas al PDF de registro de jornada

## 2.8.0 (2026-04-12)

### Features

- pdf de registro de jornada conforme al rdl 8/2019

## 2.7.2 (2026-03-23)

### Bug Fixes

- use NEXT_PUBLIC_SITE_URL as redirectTo in worker invite email

## 2.7.1 (2026-03-22)

### Bug Fixes

- add schedule feature label and fix dark mode badge styles in CenterListView

## 2.7.0 (2026-03-22)

### Features

- shift swap request modal with month/day picker and missing tests

## 2.6.0 (2026-03-21)

### Features

- worker schedule templates, shift management and dark mode fixes

## 2.5.0 (2026-03-14)

### Features

- add export range dropdown with date picker for work history

### Bug Fixes

- add jspdf deps to package.json and remove .env.local from tracking

## 2.4.0 (2026-03-07)

### Features

- implement dark/light mode across the entire app

## 2.3.1 (2026-02-24)

### Bug Fixes

- resolve i18n namespace conflict for reports card in AdminDashboard

## 2.3.0 (2026-02-24)

### Features

- apply i18n to all 14 post-merge components (ES/EN)
- implement i18n with next-intl (ES/EN), global footer with locale switcher
- merge main v2.2.0 into i18n branch, resolve conflicts

## 2.2.0 (2026-02-20)

### Features

- worker admin management with manual and Excel bulk import (v2.2.0)

## 1.8.0 (2026-02-14)

### Features

- add auto-logout after 10 minutes of inactivity

## 1.7.0 (2026-02-13)

### Features

- implement break functionality with schedule configuration

## 1.6.0 (2026-02-12)

### Features

- add super admin and company admin role separation

## 1.5.0 (2026-02-11)

### Features

- support date range selection for day-off requests

## 1.4.0 (2026-02-09)

### Features

- add work calendar view with Nager.Date public holidays API

## 1.3.0 (2026-02-09)

### Features

- add availability management feature

## 1.2.0 (2026-02-03)

### Features

- add payroll view and document management
- move work history to separate page and add UserMenu to all views

### Bug Fixes

- correct work history filter logic and add period navigation

## 1.1.0 (2026-02-02)

### Features

- add user dropdown menu and profile view

## 1.0.0 (2026-01-29)

### Bug Fixes

- add semantic-release for automatic versioning
- **ci:** remove explicit pnpm version to use packageManager
- **ci:** use Node.js 22 for semantic-release
