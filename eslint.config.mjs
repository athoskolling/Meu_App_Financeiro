import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

const MENSAGEM_DOMAIN = 'domain/ é TypeScript puro: sem I/O, framework ou banco (ver CLAUDE.md).';

export default tseslint.config(
  { ignores: ['node_modules', 'coverage', 'dist', '.next', '.claude'] },
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
  // T0.2: isolamento de domain/ (TypeScript puro: sem I/O, framework ou banco)
  {
    files: ['domain/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            'fs',
            'fs/promises',
            'path',
            'os',
            'child_process',
            'http',
            'https',
            'net',
            'crypto',
            'stream',
            'worker_threads',
            'process',
            'drizzle-orm',
            'pg',
            'postgres',
            'next',
            'react',
            'react-dom',
          ].map((name) => ({ name, message: MENSAGEM_DOMAIN })),
          patterns: [
            {
              group: ['node:*', 'drizzle-orm/*', '@supabase/*', 'next/*', 'react/*', 'react-dom/*'],
              message: MENSAGEM_DOMAIN,
            },
          ],
        },
      ],
      'no-restricted-globals': [
        'error',
        ...['fetch', 'process', 'require', 'XMLHttpRequest', 'WebSocket'].map((name) => ({
          name,
          message: MENSAGEM_DOMAIN,
        })),
      ],
      // import() dinâmico: não é coberto por no-restricted-imports. Barra qualquer
      // import() em domain/ (módulo proibido ou caminho não literal, que não dá para checar).
      'no-restricted-syntax': ['error', { selector: 'ImportExpression', message: MENSAGEM_DOMAIN }],
    },
  },
  prettier,
);
