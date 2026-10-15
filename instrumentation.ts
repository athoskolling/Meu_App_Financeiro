// Roda uma vez quando o servidor Next inicia (não no `next build`): valida as variáveis
// de ambiente para o app falhar na partida, dizendo qual variável falta.
// Docs: https://nextjs.org/docs/app/guides/instrumentation
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { env } = await import('./lib/env');
    env();
  }
}
