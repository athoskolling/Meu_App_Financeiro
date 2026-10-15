import { builtinModules } from 'node:module';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

const MENSAGEM_DOMAIN = 'domain/ é TypeScript puro: sem I/O, framework ou banco (ver CLAUDE.md).';
const MENSAGEM_PERMITIDOS = 'domain/ só importa arquivos do próprio domain/ (ADR-0017).';

// ADR-0017: lista de permitidos na forma `group` (gitignore-style): barra tudo ('**') e
// reabre só os relativos. NÃO usar `regex`: falha em silêncio para fs, pg e @/lib/io.
// Docs: https://eslint.org/docs/latest/rules/no-restricted-imports (patterns/group, negação com "!")
//       https://typescript-eslint.io/rules/no-restricted-imports/
const MENSAGEM_TIPO =
  "Em domain/, use `import type { X } from './arquivo'` em vez de `import('...')` em posição de tipo (ADR-0017).";
const RELATIVOS = ['**', '!./**', '!../**', '!.', '!..'];

const importsDomain = (permitidosExtras = []) => [
  'error',
  {
    paths: [...builtinModules, 'drizzle-orm', 'pg', 'postgres', 'next', 'react', 'react-dom'].map(
      (name) => ({ name, message: MENSAGEM_DOMAIN }),
    ),
    patterns: [
      {
        group: [
          'node:*',
          'drizzle-orm/*',
          '@supabase/*',
          'next/*',
          'react/*',
          'react-dom/*',
          'pg/*',
          'postgres/*',
        ],
        message: MENSAGEM_DOMAIN,
      },
      // A lista de permitidos vem por último: as exceções "!" precisam ser as últimas.
      {
        group: [...RELATIVOS, ...permitidosExtras.map((nome) => `!${nome}`)],
        message: MENSAGEM_PERMITIDOS,
      },
    ],
  },
];

export default tseslint.config(
  { ignores: ['node_modules', 'coverage', 'dist', '.next', '.claude/worktrees/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ['eslint.config.mjs'],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  // ADR-0017: .js/.mjs/.cjs não passam pelo type-check (o project service não os cobre).
  { files: ['**/*.{js,mjs,cjs}'], ...tseslint.configs.disableTypeChecked },
  // .cjs: globais do CommonJS declarados à mão (o pacote "globals" seria dependência nova).
  {
    files: ['**/*.cjs'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: {
        module: 'readonly',
        exports: 'writable',
        require: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
      },
    },
  },
  // Os blocos de domain/ devem ficar por último (antes de prettier) para nenhum bloco posterior sobrepor as regras (ADR-0017).
  // T0.2: isolamento de domain/ (TypeScript puro: sem I/O, framework ou banco)
  {
    files: ['domain/**/*.{ts,tsx,mts,cts,js,jsx,mjs,cjs}'],
    // Comentários eslint-disable não valem em domain/ (ADR-0017).
    linterOptions: { noInlineConfig: true, reportUnusedDisableDirectives: 'error' },
    rules: {
      'no-restricted-imports': 'off',
      '@typescript-eslint/no-restricted-imports': importsDomain(),
      'no-restricted-globals': [
        'error',
        ...[
          'fetch',
          'process',
          'require',
          'XMLHttpRequest',
          'WebSocket',
          'globalThis',
          'global',
          'window',
          'self',
          'eval',
          'module',
          'exports',
        ].map((name) => ({
          name,
          message: MENSAGEM_DOMAIN,
        })),
      ],
      // import() dinâmico: não é coberto por no-restricted-imports. Barra qualquer
      // import() em domain/ (módulo proibido ou caminho não literal, que não dá para checar).
      'no-restricted-syntax': [
        'error',
        { selector: 'ImportExpression', message: MENSAGEM_DOMAIN },
        // import("x") em posição de tipo (inclui typeof import("x")): use `import type` normal.
        { selector: 'TSImportType', message: MENSAGEM_TIPO },
        { selector: "CallExpression[callee.name='Function']", message: MENSAGEM_DOMAIN },
        {
          selector: "CallExpression[callee.property.name='constructor']",
          message: MENSAGEM_DOMAIN,
        },
        // import.meta
        { selector: 'MetaProperty', message: MENSAGEM_DOMAIN },
        { selector: "NewExpression[callee.name='Function']", message: MENSAGEM_DOMAIN },
      ],
    },
  },
  // ADR-0017: testes dentro de domain/ podem importar vitest, além dos relativos.
  {
    files: ['domain/**/*.test.{ts,tsx,mts,cts}'],
    rules: { '@typescript-eslint/no-restricted-imports': importsDomain(['vitest']) },
  },
  prettier,
);
