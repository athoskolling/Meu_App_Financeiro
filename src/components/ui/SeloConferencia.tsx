import type { EstadoSelo } from '../contratos/ui';

const CONFIG_SELO: Record<EstadoSelo, { rotulo: string; classes: string }> = {
  confere: {
    rotulo: 'Confere',
    classes: '-rotate-3 border-[1.5px] border-confere text-confere',
  },
  verificar: {
    rotulo: 'Verificar',
    classes: '-rotate-3 border-[1.5px] border-aviso bg-aviso-fundo text-aviso',
  },
  nao_confere: {
    rotulo: 'Não confere',
    classes: '-rotate-3 border-[1.5px] border-aviso text-aviso',
  },
  aguardando: {
    rotulo: 'Aguardando',
    classes: 'border-[1.5px] border-dashed border-texto-suave text-texto-medio',
  },
};

export function SeloConferencia({ estado }: { estado: EstadoSelo }) {
  const { rotulo, classes } = CONFIG_SELO[estado];

  return (
    <span
      className={`inline-block shrink-0 rounded px-2.5 py-0.5 text-[13px] font-semibold ${classes}`}
    >
      {rotulo}
    </span>
  );
}
