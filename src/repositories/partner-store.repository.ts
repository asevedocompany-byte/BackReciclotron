import type { PartnerStore } from "@reciclotron/contracts";
import type { PartnerStoreRepository as IPartnerStoreRepository } from "@reciclotron/domain";
import { createLojaParceira, findAllLojasParceiras, findLojaParceiraById, findAllCategoriasParceiro, updateLojaParceira } from "../legacy-db/queries/lojas-parceiras.js";
import type { CorporaWithCategory } from "../legacy-db/schema.js";

export class PartnerStoreRepository implements IPartnerStoreRepository {
  private mapToContract(item: CorporaWithCategory): PartnerStore {
    return {
      id: String(item.seq),
      name: item.empresa,
      city: item.city || "Sem cidade",
      description: item.obs || "Sem descrição",
      partnershipDetails: item.catname || "Loja Parceira",
      active: item.status === 1,
      cnpj: item.cnpj,
      email: item.aemail,
      address: item.address,
      address2: item.address2,
      bairro: item.bairro,
      zip: item.zip,
      state: item.state,
      phone1: item.phone1,
      phone: item.phone,
      phone31: item.phone31,
      phone3: item.phone3,
      respons: item.respons,
      pinLoja: item.pin_loja,
      categoryName: item.catname,
      categoria: item.categoria,
      cStoreId: item.c_storeid,
      logoUrl: item.logomarca,
      // A tabela legada corpora não possui campos de criação/atualização.
      // Não fabricar a data atual: a interface exibirá "—" quando o valor for desconhecido.
      createdAt: "",
      updatedAt: ""
    };
  }

  async findAll(filters?: { search?: string; status?: boolean }): Promise<PartnerStore[]> {
    try {
      const items = await findAllLojasParceiras({
        search: filters?.search,
        ativa: filters?.status
      });
      return items.map((item) => this.mapToContract(item));
    } catch (err) {
      console.error('[PartnerStoreRepository] Erro ao consultar lojas no MySQL legado:', err);
      throw err;
    }
  }

  async findById(id: string): Promise<PartnerStore | null> {
    console.log(`[PartnerStoreRepository] Executando findById no MySQL legado para o ID: ${id}`);
    const seq = Number(id);
    if (isNaN(seq)) {
      console.warn(`[PartnerStoreRepository] ID inválido (não numérico): ${id}`);
      return null;
    }
    try {
      const item = await findLojaParceiraById(seq);
      if (!item) return null;
      return this.mapToContract(item);
    } catch (err) {
      console.error(`[PartnerStoreRepository] Erro ao buscar loja ${seq} no MySQL:`, err);
      throw err;
    }
  }

  async create(data: Omit<PartnerStore, "id" | "createdAt" | "updatedAt">): Promise<PartnerStore> {
    console.info('[PartnerStoreRepository] Criando loja parceira no banco legado', {
      name: data.name,
      city: data.city,
      active: data.active
    });
    const seq = await createLojaParceira(data);
    const created = await this.findById(String(seq));
    if (!created) throw new Error(`Loja criada, mas não foi possível reler o registro ${seq}.`);
    return created;
  }

  async update(id: string, data: Partial<Omit<PartnerStore, "id" | "createdAt" | "updatedAt">>): Promise<PartnerStore | null> {
    const startedAt = Date.now();
    console.log(`[PartnerStoreRepository] Atualização iniciada para loja ${id}`, { data });
    const seq = Number(id);
    if (isNaN(seq)) {
      console.warn(`[PartnerStoreRepository] ID inválido (não numérico): ${id}`);
      return null;
    }

    const legacyData = {
      empresa: data.name,
      city: data.city,
      cnpj: data.cnpj,
      aemail: data.email,
      address: data.address,
      address2: data.address2,
      bairro: data.bairro,
      zip: data.zip,
      state: data.state,
      phone1: data.phone1,
      phone: data.phone,
      phone31: data.phone31,
      phone3: data.phone3,
      respons: data.respons,
      obs: data.description,
      pin_loja: data.pinLoja,
      categoria: data.categoria,
      c_storeid: data.cStoreId,
      status: data.active !== undefined ? (data.active ? 1 : 0) : undefined,
    };
    console.log(`[PartnerStoreRepository] Payload convertido para corpora.seq=${seq}`, { legacyData });

    try {
      const updated = await updateLojaParceira(seq, legacyData);
      console.log(`[PartnerStoreRepository] UPDATE finalizado para loja ${id}`, {
        updated,
        elapsedMs: Date.now() - startedAt
      });
      const result = await this.findById(id);
      console.log(`[PartnerStoreRepository] Releitura após UPDATE finalizada para loja ${id}`, {
        found: Boolean(result),
        elapsedMs: Date.now() - startedAt
      });
      return result;
    } catch (error) {
      console.error(`[PartnerStoreRepository] Falha ao atualizar loja ${id}`, {
        seq,
        elapsedMs: Date.now() - startedAt,
        error: error instanceof Error
          ? { name: error.name, message: error.message, stack: error.stack }
          : String(error)
      });
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    console.error(`[PartnerStoreRepository] Tentativa de exclusão no banco legado (somente leitura) para o ID: ${id}`);
    throw new Error("Operações de escrita (exclusão) não são permitidas no banco de dados legado (somente leitura).");
  }

  async findAllCategories(): Promise<Array<{ id: number; name: string }>> {
    console.log('[PartnerStoreRepository] Buscando categorias de parceiros');
    const categories = await findAllCategoriasParceiro();
    return categories.map(c => ({
      id: c.seq,
      name: c.catname || "Sem nome"
    }));
  }
}
