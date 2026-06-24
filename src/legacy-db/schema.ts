/**
 * SCHEMA DO BANCO LEGADO (MySQL KingHost)
 * Database: reciclopontos
 * Host: mysql.web-ded-330737b.kinghost.net
 *
 * Este arquivo documenta as tabelas e colunas do banco do cliente.
 * Use as interfaces aqui para tipar os resultados das queries.
 *
 * ⚠️  SOMENTE LEITURA — não executar INSERT, UPDATE ou DELETE neste banco.
 */

// ── qwclient — Clientes/Membros do programa de fidelidade ───────────────────

export interface QwClient {
  memberid: number;           // PK — ID único do membro
  PhoneIndex: string;         // Índice de telefone normalizado
  phonefull: string;          // Telefone completo
  categoria: number;          // Categoria do cliente (FK → categ_cliente)
  cliente_indicador: string;  // Código do indicador
  title: string;              // Tratamento (Sr., Sra., etc.)
  firstname: string;          // Nome
  lastname: string;           // Sobrenome
  cardnumber: string;         // Número do cartão fidelidade
  cpf: string;                // CPF
  password: string;           // Senha (hash legado)
  address: string;            // Endereço
  bairro: string;             // Bairro
  city: string;               // Cidade
  state: string;              // UF (2 chars)
  zip: string;                // CEP
  area: string;               // Área/região
  phone1: string;             // Telefone principal
  phone2: string;             // Telefone secundário
  phone3: string;             // Telefone terciário
  phone4: string;             // Telefone quaternário
  birthday: string | null;    // Data de nascimento (DATE)
  email: string;              // E-mail
  datesince: string;          // Data de cadastro (DATETIME)
  staffid: string;            // ID do atendente que cadastrou
  info: string;               // Observações livres
  storeid: string;            // Loja de origem (FK → store.storeid)
  cact: number;               // Ativo? 1 = sim, 0 = não
  corresp: string;            // Tipo de correspondência
  std: number;                // Flag padrão
  impacto_social: number;     // Flag impacto social
  cidadao: string | null;     // Data atingiu nível Cidadão
  gladiador: string | null;   // Data atingiu nível Gladiador
  imperador: string | null;   // Data atingiu nível Imperador
  deus: string | null;        // Data atingiu nível Deus
}

// ── store — Lojas parceiras ──────────────────────────────────────────────────

export interface Store {
  storeid: number;            // PK — ID da loja
  sprofile: number;           // Perfil da loja
  snumber: string;            // Número/código da loja
  pin_loja: string;           // PIN de acesso da loja
  sname: string;              // Nome da loja
  sowner: string;             // Proprietário
  smanager: string;           // Gerente
  saddress1: string;          // Endereço linha 1
  saddress2: string;          // Endereço linha 2
  scity: string;              // Cidade
  sstate: string;             // UF
  szip: string;               // CEP
  sphonearea: string;         // DDD
  sphone: string;             // Telefone
  sfaxarea: string;           // DDD fax
  sfax: string;               // Fax
  semail: string;             // E-mail
  website: string;            // Site
  instagram: string;          // Instagram
  facebook: string;           // Facebook
  twitter: string;            // Twitter
  googleplus: string;         // Google+
  youtube: string;            // YouTube
  sdatesince: string;         // Data de cadastro (DATETIME)
  supdatedate: string;        // Data de atualização (DATETIME)
  comments: string;           // Observações
  simage: string;             // Imagem da loja
  slogo: string;              // Logo da loja
  stax: number;               // Taxa
  sloyalcoef: number;         // Coeficiente de fidelidade
  status: number;             // Ativa? 1 = sim, 0 = não
}

// ── entidades — Entidades parceiras / pontos de coleta ──────────────────────

export interface Entidade {
  en_seq: number;             // PK — ID da entidade
  en_name: string;            // Nome da entidade
  en_obs: string;             // Observações
  status: number;             // Ativa? 1 = sim, 0 = não
}

// ── qwpurchase — Transações / compras / resgates ────────────────────────────

export interface QwPurchase {
  purchaseid: number;         // PK
  memberid: number;           // FK → qwclient.memberid
  qr_reward_id: number;       // FK → qr_rewards_db
  estabel_parceiro_id: number;// FK → store (estabelecimento parceiro)
  corpora_validante: number;  // FK → corpora
  indicador_id: string;       // Código do indicador
  entidade_id: number;        // FK → entidades
  amount: number;             // Valor em R$ da transação
  points: number;             // Pontos gerados/resgatados
  qtty: string;               // Quantidade
  fpgto: number;              // Forma de pagamento
  date: string;               // Data da transação (DATE)
  qr_date_expire: string;     // Validade do QR Code
  date_use_cupom: string;     // Data de uso do cupom
  staffid: number;            // Atendente
  tp: string;                 // Tipo: 'C' = crédito, 'D' = débito
  tp_voucher: number;         // Tipo de voucher
  hist: string;               // Histórico/observações
  recyclablesseq: number;     // FK → recyclables
  catprod: number;            // Categoria do produto
  qttyprod: string;           // Quantidade do produto
  pstoreid: number;           // Loja do ponto (FK → store)
  reward_id: number;          // FK → brindes
  pnum: string;               // Número do pedido
  ped: string;                // Pedido
  status_brinde: number;      // Status do brinde
  autonum: string;            // Número automático
}

// ── operations — Tipos de operação ──────────────────────────────────────────

export interface Operation {
  seq: number;                // PK
  oname: string;              // Nome da operação
  tp: string;                 // Tipo
  odesc: string;              // Descrição
}

// ── recyclables — Materiais recicláveis ─────────────────────────────────────

export interface Recyclable {
  // (inspecionar com DESCRIBE recyclables se necessário)
  [key: string]: unknown;
}

export interface Brinde {
  [key: string]: unknown;
}

// ── corpora — Corporações/empresas parceiras ──────────────────────────────────

export interface Corpora {
  seq: number;
  c_storeid: number;
  categoria: number;
  pin_loja: string;
  empresa: string;
  cardcorpnumber?: string | null;
  ramo: string;
  razaosocial: string;
  cnpj: string;
  aemail: string;
  cemail: string;
  address: string;
  address2: string;
  bairro: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone1: string;
  phone: string;
  phone31: string;
  phone3: string;
  respons: string;
  obs: string;
  status: number;
  destaque: number;
  logomarca?: string | null;
  dominio?: string | null;
  taxa_conversao: number;
  pin_loja_token: string;
  token_partner: string;
}

// ── categ_parceiro — Categorias de parceiros ──────────────────────────────────

export interface CategParceiro {
  seq: number;
  catname?: string | null;
  status?: number | null;
}

export type CorporaWithCategory = Corpora & {
  catname?: string | null;
};


// ── Tabelas disponíveis (referência completa) ────────────────────────────────
/**
 * admin              — Usuários admin do sistema legado
 * admin_beta         — Usuários admin beta
 * album              — Álbuns de fotos
 * beneficios_cat     — Categorias de benefícios
 * brindes            — Prêmios/recompensas
 * brindes_cat        — Categorias de brindes
 * cartao_presente    — Cartões presente
 * cat                — Categorias gerais
 * categ_cliente      — Categorias de clientes
 * categ_parceiro     — Categorias de parceiros
 * corpora            — Corporações/empresas parceiras
 * entidades          — Entidades/pontos de coleta  ← USE AQUI
 * indicacao          — Sistema de indicações
 * langlist           — Lista de idiomas
 * languages          — Traduções
 * lastdate_email     — Controle de último e-mail enviado
 * log                — Log de operações
 * login              — Sessões de login
 * maiores1           — Ranking (maiores pontuadores)
 * member_review      — Avaliações de membros
 * newsletter         — Inscrições newsletter
 * operations         — Tipos de operação
 * opiniao            — Opiniões/feedback
 * opiniao_2019       — Opiniões de 2019 (histórico)
 * points_request     — Solicitações de pontos
 * promos_mensais_set — Promoções mensais configuradas
 * qr_rewards_db      — Recompensas QR Code (instâncias)
 * qr_rewards_master  — Recompensas QR Code (template)
 * qwclient           — Clientes/membros             ← USE AQUI
 * qwpay              — Pagamentos
 * qwpurchase         — Transações                   ← USE AQUI
 * qwsale             — Vendas
 * recyclables        — Materiais recicláveis
 * recycle_cat        — Categorias de recicláveis
 * safe               — Dados seguros/cofre
 * store              — Lojas parceiras               ← USE AQUI
 * top_brindes_cat    — Top categorias de brindes
 * website            — Configurações do website
 */
