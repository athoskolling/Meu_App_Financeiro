// Contratos puros de ViewModel para as telas do Meu Financeiro (ADR-0028).
// Todos os valores monetários são strings já formatadas pelo servidor; a UI não calcula regra financeira.

export type EstadoSelo = 'confere' | 'verificar' | 'nao_confere' | 'aguardando';

export interface ResumoSyncHeader {
  rotuloStatus: string;
  emPrevia?: boolean;
}

export interface DiaGastoVM {
  dia: number;
  alturaPx: number;
  estado: 'passado' | 'hoje' | 'futuro';
  rotuloEixo?: string;
}

export interface CategoriaGastoVM {
  nome: string;
  percentualLargura: number;
  valorFormatado: string;
}

export interface MovimentacaoRecenteVM {
  id: string;
  dataCurta: string;
  descricao: string;
  metadados: string;
  valorFormatado: string;
  tipo: 'despesa' | 'receita' | 'fora_dos_gastos';
  badge?: string;
}

export interface ContaConferidaVM {
  id: string;
  nome: string;
  tipo: string;
  saldoFormatado: string;
  estadoSelo: EstadoSelo;
  nota: string;
}

export interface PendenciaPainelVM {
  id: string;
  destaque: 'aviso' | 'neutro';
  mensagem: string;
  rotuloLink: string;
  href: string;
}

export interface ResumoPainelVM {
  mesTitulo: string;
  subtitulo: string;
  podeVoltarMes: boolean;
  podeAvancarMes: boolean;
  sobrouFormatado: string;
  entrouFormatado: string;
  saiuFormatado: string;
  notaCaixinhas: string;
  hrefCaixinhas: string;
  maiorGastoTexto: string;
  descricaoGraficoDiario: string;
  diasGasto: DiaGastoVM[];
  categorias: CategoriaGastoVM[];
  ultimasMovimentacoes: MovimentacaoRecenteVM[];
  contasConferidas: ContaConferidaVM[];
  pendencias: PendenciaPainelVM[];
}

export interface AlertaDivergenciaVM {
  mensagem: string;
  rotuloAcao: string;
  hrefAcao: string;
}

export interface LinhaTransacaoVM {
  id: string;
  dataCurta: string;
  descricao: string;
  categoria: string;
  conta: string;
  valorFormatado: string;
  tipo: 'despesa' | 'receita' | 'fora_dos_gastos';
  badge?: string;
}

export interface TransacoesVM {
  mesTitulo: string;
  alertaDivergencia?: AlertaDivergenciaVM;
  opcoesConta: string[];
  opcoesCategoria: string[];
  filtroConta: string;
  filtroCategoria: string;
  filtroBusca: string;
  contagemTexto: string;
  gastosFiltroTexto: string;
  linhas: LinhaTransacaoVM[];
  rotuloMesAnterior: string;
}

export interface ContaResumoVM {
  id: string;
  nome: string;
  nota: string;
  saldoFormatado: string;
  estadoSelo: EstadoSelo;
}

export interface CaixinhaVM {
  id: string;
  nome: string;
  detalhe: string;
  valorFormatado: string;
}

export interface ConexaoBancoVM {
  id: string;
  instituicao: string;
  statusTexto: string;
  expirada: boolean;
}

export interface BackupResumoVM {
  mensagem: string;
}

export interface ContasPatrimonioVM {
  patrimonioFormatado: string;
  percentualContas: number;
  percentualCaixinhas: number;
  descricaoBarra: string;
  totalContasFormatado: string;
  totalCaixinhasFormatado: string;
  ressalva: string;
  contas: ContaResumoVM[];
  caixinhas: CaixinhaVM[];
  resumoConexoes: string;
  conexoes: ConexaoBancoVM[];
  notaConexoes: string;
  backup: BackupResumoVM;
}

export interface EnviarPrintVM {
  ultimoPrintTexto: string;
  passos: readonly string[];
  avisoPrivacidade: string;
  hrefDestino: string;
  rotuloBotao: string;
}

export type EstadoRevisao = 'aguardando' | 'nao_confere' | 'confere' | 'confirmado';

export interface LinhaExtraidaVM {
  id: string;
  dataCurta: string;
  descricao: string;
  valorFormatado: string;
  emRevisao: boolean;
  duplicada: boolean;
  situacao: 'Nova' | 'Revisar' | 'Revisada' | 'Já importada';
  tomSituacao: 'confere' | 'aviso' | 'neutro';
}

export interface RevisarPrintVM {
  estado: EstadoRevisao;
  subtitulo: string;
  totalLidas: number;
  totalNovas: number;
  totalIgnoradas: number;
  textoCobertura: string;
  estadoSelo: EstadoSelo;
  mensagemConferencia: string;
  linhas: LinhaExtraidaVM[];
  valorDestaqueInicial: string;
  rotuloCampoDestaque: string;
  textoAjudaDestaque: string;
  podeConfirmar: boolean;
  rotuloBotaoConfirmar: string;
  mensagemBloqueio?: string;
  mensagemConfirmado?: string;
  barrasPrevia: string[];
}
