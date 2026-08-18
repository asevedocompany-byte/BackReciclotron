import type { CollectionPoint } from "@reciclotron/contracts";
import type { CollectionPointRepository as ICollectionPointRepository } from "@reciclotron/domain";
import { createPontoColeta, findAllPontosColeta, findPontoColetaById, updatePontoColeta } from "../legacy-db/queries/pontos-coleta.js";
import type { Store } from "../legacy-db/schema.js";

function safeIsoDate(val: unknown): string {
  if (!val) return new Date().toISOString();
  if (val instanceof Date) {
    return isNaN(val.getTime()) ? new Date().toISOString() : val.toISOString();
  }
  const str = String(val).trim();
  if (!str || str.startsWith("0000-00-00")) {
    return new Date().toISOString();
  }
  const d = new Date(str);
  return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

export class CollectionPointRepository implements ICollectionPointRepository {
  private mapToContract(item: Store): CollectionPoint {
    const addrParts = [];
    if (item.saddress1) addrParts.push(item.saddress1);
    if (item.saddress2) addrParts.push(item.saddress2);
    if (item.szip) addrParts.push(`CEP: ${item.szip}`);
    if (item.sstate) addrParts.push(item.sstate);
    const address = addrParts.join(", ");

    const descParts = [];
    if (item.comments) descParts.push(item.comments);
    if (item.sowner) descParts.push(`Proprietário: ${item.sowner}`);
    if (item.smanager) descParts.push(`Responsável: ${item.smanager}`);
    if (item.semail) descParts.push(`E-mail: ${item.semail}`);
    if (item.sphone) {
      const area = item.sphonearea ? `(${item.sphonearea}) ` : "";
      descParts.push(`Tel: ${area}${item.sphone}`);
    }
    if (item.snumber) descParts.push(`Nº: ${item.snumber}`);
    if (item.pin_loja) descParts.push(`PIN: ${item.pin_loja}`);
    if (item.slogo) descParts.push(`Logo: ${item.slogo}`);

    const description = descParts.join(" | ") || "Sem descrição";

    return {
      id: String(item.storeid),
      name: item.sname,
      city: item.scity || "Sem Informação",
      description,
      address: address || "Sem endereço",
      active: item.status === 1,
      createdAt: safeIsoDate(item.sdatesince),
      updatedAt: safeIsoDate(item.supdatedate)
    };
  }

  async findAll(filters?: { search?: string; status?: boolean }): Promise<CollectionPoint[]> {
    try {
      const items = await findAllPontosColeta({
        search: filters?.search,
        ativa: filters?.status
      });
      return items.map((item) => this.mapToContract(item));
    } catch (err) {
      console.error('[CollectionPointRepository] Erro ao consultar tabela store no MySQL:', err instanceof Error
        ? { name: err.name, message: err.message }
        : String(err));
      throw err;
    }
  }

  async findById(id: string): Promise<CollectionPoint | null> {
    console.log(`[CollectionPointRepository] Executando findById no MySQL legado para o ID: ${id}`);
    const seq = Number(id);
    if (isNaN(seq)) {
      console.warn(`[CollectionPointRepository] ID inválido (não numérico): ${id}`);
      return null;
    }
    try {
      const item = await findPontoColetaById(seq);
      if (!item) return null;
      return this.mapToContract(item);
    } catch (err) {
      console.error(`[CollectionPointRepository] Erro ao buscar loja ${seq} no MySQL:`, err instanceof Error
        ? { name: err.name, message: err.message }
        : String(err));
      throw err;
    }
  }

  async create(data: Omit<CollectionPoint, "id" | "createdAt" | "updatedAt">): Promise<CollectionPoint> {
    console.info('[CollectionPointRepository] Criando ponto no banco legado', { data });
    const storeid = await createPontoColeta(data);
    const created = await this.findById(String(storeid));
    if (!created) throw new Error(`Ponto criado, mas não foi possível reler o registro ${storeid}.`);
    return created;
  }

  async update(id: string, data: Partial<Omit<CollectionPoint, "id" | "createdAt" | "updatedAt">>): Promise<CollectionPoint | null> {
    const storeid = Number(id);
    if (!Number.isInteger(storeid)) return null;
    console.info('[CollectionPointRepository] Atualizando ponto no banco legado', { storeid, data });
    await updatePontoColeta(storeid, data);
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    console.error(`[CollectionPointRepository] Tentativa de exclusão no banco legado (somente leitura) para o ID: ${id}`);
    throw new Error("Operações de escrita (exclusão) não são permitidas no banco de dados legado (somente leitura).");
  }
}
