<div align="center">

# Australia EOI Points Calculator

<img width="2160" height="2160" alt="878_2x_shots_so" src="https://github.com/user-attachments/assets/f23703cf-0cf8-4848-ab24-82fc6c9a37aa" />

*A comprehensive tool for calculating Expression of Interest points for Australian immigration, featuring real-time calculations, bilingual support, and modern responsive design.*

[![Next.js](https://img.shields.io/badge/Next.js-15.0.0-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0.0-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3.3-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.1.11-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

</div>

## 🗺️ Pages

The app is three pages sharing one header nav:

- **Profile** (`/profile`) — the only place shared criteria (age, English, education, partner status, bonuses) and nominated occupations/skills assessments are entered. Both other pages read this data read-only and link back here to edit it.
- **Independent Migration** (`/`) — the points-tested result for subclass 189/190/491: score, timeline, reference info, cost estimate and the subclass 191 permanent-residence pathway.
- **Employer Sponsorship** (`/sponsorship`) — the non-points-tested checklist for subclass 482/186, checking the occupations/English/age entered on Profile against the Core Skills Occupation List, salary thresholds, work experience and the under-45 age limit.

## ✨ Features

- 📊 **Real-time Calculation**: Instant EOI points calculation based on current immigration rules
- 🧭 **Multiple Skills Assessments**: Hold several nominated occupations side by side — shared criteria (age, English, education, partner, bonuses) apply to all, while work experience and Professional Year are entered per occupation
- 🗺️ **Per-state Pathways**: 189 / 190 / 491 evaluated per assessment, including each state & territory's own 190/491 occupation list — the tool tags which states can nominate your occupation, alongside a snapshot of whether each state's intake is currently open, closed or limited
- 🧮 **Occupation Comparison**: Once you enter 2+ skills assessments, a summary table lines them up by best pathway, points and eligible states
- 📅 **Score Timeline**: Enter real months (birth, work start, test/assessment dates) to project your score over the next 5 years — age-bracket drops, work milestones, and credential expiries (English test, skills assessment per authority, NAATI CCL) plotted on a step chart
- 🏡 **Path to Permanent Residence**: For 491/494 holders, projects the earliest subclass 191 eligibility date from your grant month, alongside the current holding-period, income-year and application-fee requirements
- 💰 **Cost Estimate**: A rough visa application charge + skills assessment + English test + state nomination fee budget, built from your entered criteria
- 🤝 **Employer Sponsorship Checklist**: A separate `/sponsorship` page (own nav tab) for the non-points-tested subclass 482 (Core Skills / Specialist Skills) and 186 (Direct Entry / Temporary Residence Transition) pathways — checks the occupations, English level and age already entered on the Profile page against the Core Skills Occupation List, salary thresholds (CSIT/SSIT), work experience and the under-45 age limit, for applicants who can't yet reach 65 points
- 🖼️ **Share Card & Report Export**: Generate a Cream or Charcoal PNG summary card, or a detailed printable report (print / save as PDF) covering the full breakdown
- 🌐 **Bilingual Support**: Full support for English and Simplified Chinese (简体中文)
- 📱 **Responsive Design**: Optimized for all devices from mobile to desktop
- 🎨 **Dark/Light Mode**: System preference detection with manual override
- 🔗 **Shareable Links**: Full form state encoded in the URL for one-click sharing
- 💾 **Persistent Storage**: Form data saved locally for convenience
- 🔍 **SEO Optimized**: Complete Open Graph and Twitter Cards integration, with a dynamic per-score OG image for shared links

All point values, pathway rules, per-state occupation lists, program status, permanent-residence requirements, fee figures and the employer-sponsorship thresholds/occupation list live in `src/data/` (`pointsCriteria.ts`, `occupations.ts`, `stateLists.ts`, `programStatus.ts`, `pr191.ts`, `fees.ts`, `csol.ts`, `sponsorship.ts`) — nothing is hardcoded in the UI or the calculation engine.

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
