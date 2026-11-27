import type { CategoriaGastoVM } from '../contratos/ui';

export function ListaCategorias({ categorias }: { categorias: CategoriaGastoVM[] }) {
  return (
    <section className="mt-14">
      <h2 className="font-titulo text-[24px] font-semibold text-texto">Para onde foi</h2>

      {categorias.length === 0 ? (
        <p className="mt-5 text-texto-suave">Nenhum gasto registrado neste mês.</p>
      ) : (
        <ul className="mt-5 flex list-none flex-col gap-3.5 p-0">
          {categorias.map((categoria) => (
            <li
              key={categoria.nome}
              className="grid grid-cols-[minmax(110px,190px)_1fr_auto] items-center gap-3 sm:gap-4"
            >
              <span className="min-w-0 truncate text-texto">{categoria.nome}</span>
              <span className="block h-2 rounded bg-trilha-barra">
                <span
                  style={{ width: `${categoria.percentualLargura}%` }}
                  className="block h-2 rounded bg-primaria"
                />
              </span>
              <span className="text-right font-medium whitespace-nowrap text-texto">
                {categoria.valorFormatado}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
