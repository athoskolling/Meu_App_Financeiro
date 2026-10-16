import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Impede o Next de gerar AGENTS.md sozinho no `next dev` (as instruções dos agentes são do projeto).
  // Docs: https://nextjs.org/docs/app/api-reference/config/next-config-js/agentRules
  agentRules: false,
};

export default nextConfig;
