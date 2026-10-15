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
