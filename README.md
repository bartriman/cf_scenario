# 10x Astro Starter

A modern, opinionated starter template for building fast, accessible, and AI-friendly web applications.

## Tech Stack

- [Astro](https://astro.build/) v5.5.5 - Modern web framework for building fast, content-focused websites
- [React](https://react.dev/) v19.0.0 - UI library for building interactive components
- [TypeScript](https://www.typescriptlang.org/) v5 - Type-safe JavaScript
- [Tailwind CSS](https://tailwindcss.com/) v4.0.17 - Utility-first CSS framework

## Prerequisites

- Node.js v22.14.0 (as specified in `.nvmrc`)
- npm (comes with Node.js)

## Getting Started

1. Clone the repository:

```bash
git clone https://github.com/przeprogramowani/10x-astro-starter.git
cd 10x-astro-starter
```

2. Install dependencies:

```bash
npm install
```

3. Run the development server:

```bash
npm run dev
```

4. Build for production:

```bash
npm run build
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run format` - Format code with Prettier
- `npm run test` - Run unit and integration tests (Vitest)
- `npm run test:e2e` - Run end-to-end tests (Playwright)
- `npm run test:e2e:ui` - Run E2E tests in interactive UI mode
- `npm run test:e2e:headed` - Run E2E tests with visible browser
- `npm run test:e2e:verify` - Verify E2E test setup and create test users

## Project Structure

```md
.
├── src/
│ ├── layouts/ # Astro layouts
│ ├── pages/ # Astro pages
│ │ └── api/ # API endpoints
│ ├── components/ # UI components (Astro & React)
│ ├── lib/ # Services, utilities, validation
│ ├── db/ # Supabase client and types
│ └── assets/ # Static assets
├── tests/
│ ├── e2e/ # End-to-end tests (Playwright)
│ │ ├── helpers/ # Test utilities
│ │ ├── auth.spec.ts # Authentication tests
│ │ ├── import-csv.spec.ts # CSV import tests
│ │ ├── scenarios-crud.spec.ts # Scenario management tests
│ │ └── ... # More E2E tests
│ ├── services/ # Service layer tests
│ └── utils/ # Utility tests
├── supabase/ # Supabase configuration
│ └── migrations/ # Database migrations
├── public/ # Public assets
└── playwright.config.ts # E2E test configuration
```

## Testing

### Unit & Integration Tests (Vitest)

```bash
# Run all unit tests
npm run test

# Run tests in watch mode
npm run test -- --watch

# Run with coverage
npm run test -- --coverage
```

### End-to-End Tests (Playwright)

```bash
# Quick start - creates test users automatically!
npm run test:e2e

# Interactive mode (recommended for development)
npm run test:e2e:ui

# Run with visible browser
npm run test:e2e:headed

# Verify setup before running tests
npm run test:e2e:verify
```

**📚 E2E Test Documentation:**
- 🚀 [Quick Start Guide](./tests/e2e/QUICKSTART.md) - Get started in 2 minutes
- 📖 [Full Documentation](./tests/e2e/README.md) - Comprehensive test guide
- 👥 [User Setup Guide](./tests/e2e/USER_SETUP.md) - Creating test users

**Test Coverage:**
- ✅ Authentication & Authorization
- ✅ CSV Import Wizard (4 steps)
- ✅ Scenario Management (CRUD)
- ✅ Export & Analytics
- ✅ Navigation & Route Protection

**~350+ E2E test cases** covering all critical user flows!

## AI Development Support

This project is configured with AI development tools to enhance the development experience, providing guidelines for:

- Project structure
- Coding practices
- Frontend development
- Styling with Tailwind
- Accessibility best practices
- Astro and React guidelines

### Cursor IDE

The project includes AI rules in `.cursor/rules/` directory that help Cursor IDE understand the project structure and provide better code suggestions.

### GitHub Copilot

AI instructions for GitHub Copilot are available in `.github/copilot-instructions.md`

### Windsurf

The `.windsurfrules` file contains AI configuration for Windsurf.

## Contributing

Please follow the AI guidelines and coding practices defined in the AI configuration files when contributing to this project.

## License

MIT
