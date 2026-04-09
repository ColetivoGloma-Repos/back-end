# Repository Guidelines

## Project Structure & Module Organization
This repository is a NestJS API in TypeScript.

- `src/main.ts`: application bootstrap.
- `src/app.module.ts`: root module wiring.
- `src/modules/*`: domain modules (`auth`, `need`, `products`, `distribution-points`, etc.) with controller/service/entity/dto splits.
- `src/common/*` and `src/utils/*`: shared helpers, decorators, and utilities.
- `src/database/*`: TypeORM `dataSource.ts` and migrations.
- `src/assets/*`: static assets.
- `dist/`: compiled output (generated).
- `.env` and `.env.example`: local configuration.

## Build, Test, and Development Commands
Use Node `20.x` and npm `10.x`.

- `npm install`: install dependencies.
- `npm run start:dev` (or `npm run dev`): run API with watch mode.
- `npm run build`: compile to `dist/`.
- `npm run start:prod`: run compiled app from `dist/main.js`.
- `npm run lint`: run ESLint and auto-fix.
- `npm run format`: run Prettier on `src/**/*.ts` and `test/**/*.ts`.
- `npm run test`, `npm run test:watch`, `npm run test:cov`: unit tests and coverage.
- `npm run typeorm:sync` / `npm run migration:generate -- <Name>`: schema sync and migration generation.

## Coding Style & Naming Conventions
- Language: TypeScript with NestJS patterns.
- Formatting: Prettier (`singleQuote: true`, `trailingComma: all`).
- Linting: ESLint with `@typescript-eslint` (`npm run lint`).
- Indentation: 2 spaces; keep imports grouped by external/internal/local.
- File naming: kebab-case for module files (for example, `create-distribution-point.dto.ts`), Nest suffixes (`*.module.ts`, `*.service.ts`, `*.controller.ts`, `*.entity.ts`, `*.dto.ts`).
- Classes/interfaces/enums: PascalCase. Variables/functions: camelCase.

## Testing Guidelines
- Framework: Jest (`jest` config in `package.json`, `rootDir: src`, `testRegex: .*\.spec\.ts$`).
- Place unit tests as `*.spec.ts` near the tested code in `src/`.
- E2E command is available (`npm run test:e2e`) and expects `test/jest-e2e.json`; create and maintain `test/` when adding e2e coverage.
- Run `npm run test:cov` for higher-risk changes (auth, persistence, critical business rules).

## Commit & Pull Request Guidelines
Recent history follows Conventional Commits style:

- Examples: `feat(Products): ...`, `fix: ...`, `chore: ...`.
- Format: `type(scope): short imperative summary`.
- Keep commits focused and atomic; include migrations/config updates in the same change set when required.

For pull requests:
- Explain **what** changed and **why**.
- Link the related issue/task.
- List validation steps run locally (for example, `npm run lint`, `npm run test`).
- Include request/response examples for API behavior changes.
