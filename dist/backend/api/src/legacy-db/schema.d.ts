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
export interface QwClient {
    memberid: number;
    PhoneIndex: string;
    phonefull: string;
    categoria: number;
    cliente_indicador: string;
    title: string;
    firstname: string;
    lastname: string;
    cardnumber: string;
    cpf: string;
    password: string;
    address: string;
    bairro: string;
    city: string;
    state: string;
    zip: string;
    area: string;
    phone1: string;
    phone2: string;
    phone3: string;
    phone4: string;
    birthday: string | null;
    email: string;
    datesince: string;
    staffid: string;
    info: string;
    storeid: string;
    cact: number;
    corresp: string;
    std: number;
    impacto_social: number;
    cidadao: string | null;
    gladiador: string | null;
    imperador: string | null;
    deus: string | null;
}
export interface Store {
    storeid: number;
    sprofile: number;
    snumber: string;
    pin_loja: string;
    sname: string;
    sowner: string;
    smanager: string;
    saddress1: string;
    saddress2: string;
    scity: string;
    sstate: string;
    szip: string;
    sphonearea: string;
    sphone: string;
    sfaxarea: string;
    sfax: string;
    semail: string;
    website: string;
    instagram: string;
    facebook: string;
    twitter: string;
    googleplus: string;
    youtube: string;
    sdatesince: string;
    supdatedate: string;
    comments: string;
    simage: string;
    slogo: string;
    stax: number;
    sloyalcoef: number;
    status: number;
}
export interface Entidade {
    en_seq: number;
    en_name: string;
    en_obs: string;
    status: number;
}
export interface QwPurchase {
    purchaseid: number;
    memberid: number;
    qr_reward_id: number;
    estabel_parceiro_id: number;
    corpora_validante: number;
    indicador_id: string;
    entidade_id: number;
    amount: number;
    points: number;
    qtty: string;
    fpgto: number;
    date: string;
    qr_date_expire: string;
    date_use_cupom: string;
    staffid: number;
    tp: string;
    tp_voucher: number;
    hist: string;
    recyclablesseq: number;
    catprod: number;
    qttyprod: string;
    pstoreid: number;
    reward_id: number;
    pnum: string;
    ped: string;
    status_brinde: number;
    autonum: string;
}
export interface Operation {
    seq: number;
    oname: string;
    tp: string;
    odesc: string;
}
export interface Recyclable {
    [key: string]: unknown;
}
export interface Brinde {
    [key: string]: unknown;
}
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
export interface CategParceiro {
    seq: number;
    catname?: string | null;
    status?: number | null;
}
export type CorporaWithCategory = Corpora & {
    catname?: string | null;
};
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
