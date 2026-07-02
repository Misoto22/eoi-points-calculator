<div align="center">

# Australia EOI Points Calculator

<img width="2160" height="2160" alt="878_2x_shots_so" src="https://github.com/user-attachments/assets/f23703cf-0cf8-4848-ab24-82fc6c9a37aa" />

*A comprehensive tool for calculating Expression of Interest points for Australian immigration, featuring real-time calculations, bilingual support, and modern responsive design.*

[![Next.js](https://img.shields.io/badge/Next.js-15.0.0-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0.0-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3.3-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.1.11-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

</div>

## ✨ Features

- 📊 **Real-time Calculation**: Instant EOI points calculation based on current immigration rules
- 🧭 **Multiple Skills Assessments**: Hold several nominated occupations side by side — shared criteria (age, English, education, partner, bonuses) apply to all, while work experience and Professional Year are entered per occupation
- 🗺️ **Per-state Pathways**: 189 / 190 / 491 evaluated per assessment, including each state & territory's own 190/491 occupation list — the tool tags which states can nominate your occupation
- 🖼️ **Share Card Export**: Generate a Cream or Charcoal PNG summary card of your result
- 🌐 **Bilingual Support**: Full support for English and Simplified Chinese (简体中文)
- 📱 **Responsive Design**: Optimized for all devices from mobile to desktop
- 🎨 **Dark/Light Mode**: System preference detection with manual override
- 🔗 **Shareable Links**: Full form state encoded in the URL for one-click sharing
- 💾 **Persistent Storage**: Form data saved locally for convenience
- 🔍 **SEO Optimized**: Complete Open Graph and Twitter Cards integration

All point values, pathway rules and per-state occupation lists live in `src/data/` (`pointsCriteria.ts`, `occupations.ts`, `stateLists.ts`) — nothing is hardcoded in the UI or the calculation engine.

## 🛠️ Tech Stack

<div align="center">

| Category       | Technologies                             |
|----------------|------------------------------------------|
| **Framework**  | Next.js 16 (App Router)                |
| **Language**   | TypeScript 5.9 (Strict Mode)           |
| **UI Library** | React 19                               |
| **Styling**    | Tailwind CSS 4 (CSS-first config)      |
| **Type**       | Noto Serif SC + system sans            |
| **Export**     | Canvas share-card renderer             |
| **i18n**       | i18next + react-i18next                |
| **Testing**    | Vitest                                 |
| **Deployment** | Vercel                                  |

</div>

## 🚀 Getting Started

### Prerequisites

- Node.js 18.x or later
- npm

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Misoto22/eoi-points-calculator.git
   cd eoi-points-calculator
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## 📦 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run test` - Run the Vitest unit suite

## 🌐 Deployment

Deployment runs **through the GitHub Actions pipeline** (`.github/workflows/ci.yml`): every push to
`main` is type-checked, tested and built, then deployed to Vercel production; pull requests get preview
deployments. See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) for the one-time secret setup
(`VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`).

- Production: [https://eoi-points-calculator.vercel.app](https://eoi-points-calculator.vercel.app)
