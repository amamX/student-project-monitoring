# Design System: Student Project Monitoring

## 1. Konsep & Nuansa
*Platform monitoring progres project mahasiswa, ada dashboard dosen dengan analytics, dark/light mode, modern dan bersih.*

Nuansa yang ingin dicapai adalah **Modern, Clean, and Premium**. 
Kita menggunakan pendekatan desain minimalis dengan garis-garis lembut, interaksi mikro (Framer Motion), serta palet warna yang profesional (Biru/Indigo) untuk memberikan kesan teknologi dan edukasi yang andal.

## 2. Tipografi
Menggunakan font modern sans-serif: **Inter**.
- Heading: `font-sans font-bold tracking-tight`
- Body: `font-sans font-normal text-slate-600 dark:text-slate-300`

## 3. Palet Warna (Tokens)
Kita menggunakan warna khusus yang didefinisikan di Tailwind (`tailwind.config.js`):

**Primary (Brand Color): Indigo/Blue**
- `primary-50`: `#eff6ff`
- `primary-100`: `#dbeafe`
- `primary-500`: `#3b82f6` (Base/Main)
- `primary-600`: `#2563eb` (Hover)
- `primary-900`: `#1e3a8a`

**Backgrounds (Light Mode)**
- `bg-background`: `#ffffff` (Card, Sidebar, Modal)
- `bg-surface`: `#f8fafc` (Body Background)

**Backgrounds (Dark Mode)**
- `dark:bg-background`: `#0f172a` (Body Background)
- `dark:bg-surface`: `#1e293b` (Card, Sidebar, Modal)

**Text**
- Light: `text-slate-900` (Heading), `text-slate-600` (Body)
- Dark: `text-slate-50` (Heading), `text-slate-300` (Body)

## 4. UI Components

### 4.1 Button
- Base: `inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none disabled:opacity-50 disabled:pointer-events-none ring-offset-background`
- Variants:
  - **Primary**: `bg-primary-600 text-white hover:bg-primary-700`
  - **Outline**: `border border-slate-200 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800`
  - **Ghost**: `hover:bg-slate-100 dark:hover:bg-slate-800`

### 4.2 Card
- Container: `rounded-xl border border-slate-200 bg-white text-slate-950 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-50`
- Padding: `p-6` (standar)

### 4.3 Input
- Styling: `flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-50`

### 4.4 Badge
- Styling: `inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors`
- Variants: Success (Green), Warning (Yellow), Error (Red), Neutral (Gray).

### 4.5 ProgressBar
- Container: `w-full bg-slate-200 rounded-full h-2.5 dark:bg-slate-700`
- Fill: `bg-primary-600 h-2.5 rounded-full`

## 5. Animasi (Framer Motion)
- **Mount/Page Transitions**: `initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}`
- **Hover**: `whileHover={{ scale: 1.02 }}`
- **Tap**: `whileTap={{ scale: 0.98 }}`
