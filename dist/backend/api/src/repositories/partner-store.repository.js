import { findAllLojasParceiras, findLojaParceiraById, findAllCategoriasParceiro, updateLojaParceira } from "../legacy-db/queries/lojas-parceiras.js";
export class PartnerStoreRepository {
    mapToContract(item) {
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
            state: item.state,
            pinLoja: item.pin_loja,
            categoryName: item.catname,
            categoria: item.categoria,
            cStoreId: item.c_storeid,
            logoUrl: item.logomarca,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
    }
    async findAll(filters) {
        console.log('[PartnerStoreRepository] Executando findAll no MySQL legado com filtros:', filters);
        try {
            const items = await findAllLojasParceiras({
                search: filters?.search,
                ativa: filters?.status
            });
            console.log(`[PartnerStoreRepository] MySQL retornou ${items.length} lojas parceiras.`);
            return items.map((item) => this.mapToContract(item));
        }
        catch (err) {
            console.error('[PartnerStoreRepository] Erro ao consultar lojas no MySQL legado:', err);
            throw err;
        }
    }
    async findById(id) {
        console.log(`[PartnerStoreRepository] Executando findById no MySQL legado para o ID: ${id}`);
        const seq = Number(id);
        if (isNaN(seq)) {
            console.warn(`[PartnerStoreRepository] ID inválido (não numérico): ${id}`);
            return null;
        }
        try {
            const item = await findLojaParceiraById(seq);
            if (!item)
                return null;
            return this.mapToContract(item);
        }
        catch (err) {
            console.error(`[PartnerStoreRepository] Erro ao buscar loja ${seq} no MySQL:`, err);
            throw err;
        }
    }
    async create(data) {
        console.error('[PartnerStoreRepository] Tentativa de criação no banco legado (somente leitura)');
        throw new Error("Operações de escrita (criação) não são permitidas no banco de dados legado (somente leitura).");
    }
    async update(id, data) {
        console.log(`[PartnerStoreRepository] Atualizando loja ${id} com dados:`, data);
        const seq = Number(id);
        if (isNaN(seq)) {
            console.warn(`[PartnerStoreRepository] ID inválido (não numérico): ${id}`);
            return null;
        }
        await updateLojaParceira(seq, {
            empresa: data.name,
            city: data.city,
            cnpj: data.cnpj,
            aemail: data.email,
            address: data.address,
            state: data.state,
            pin_loja: data.pinLoja,
            categoria: data.categoria,
            c_storeid: data.cStoreId,
            status: data.active !== undefined ? (data.active ? 1 : 0) : undefined,
        });
        return this.findById(id);
    }
    async delete(id) {
        console.error(`[PartnerStoreRepository] Tentativa de exclusão no banco legado (somente leitura) para o ID: ${id}`);
        throw new Error("Operações de escrita (exclusão) não são permitidas no banco de dados legado (somente leitura).");
    }
    async findAllCategories() {
        console.log('[PartnerStoreRepository] Buscando categorias de parceiros');
        const categories = await findAllCategoriasParceiro();
        return categories.map(c => ({
            id: c.seq,
            name: c.catname || "Sem nome"
        }));
    }
}
//# sourceMappingURL=partner-store.repository.js.map