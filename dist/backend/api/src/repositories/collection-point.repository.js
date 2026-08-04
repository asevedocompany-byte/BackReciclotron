import { findAllPontosColeta, findPontoColetaById } from "../legacy-db/queries/pontos-coleta.js";
function safeIsoDate(val) {
    if (!val)
        return new Date().toISOString();
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
export class CollectionPointRepository {
    mapToContract(item) {
        const addrParts = [];
        if (item.saddress1)
            addrParts.push(item.saddress1);
        if (item.saddress2)
            addrParts.push(item.saddress2);
        if (item.szip)
            addrParts.push(`CEP: ${item.szip}`);
        if (item.sstate)
            addrParts.push(item.sstate);
        const address = addrParts.join(", ");
        const descParts = [];
        if (item.comments)
            descParts.push(item.comments);
        if (item.sowner)
            descParts.push(`Proprietário: ${item.sowner}`);
        if (item.smanager)
            descParts.push(`Responsável: ${item.smanager}`);
        if (item.semail)
            descParts.push(`E-mail: ${item.semail}`);
        if (item.sphone) {
            const area = item.sphonearea ? `(${item.sphonearea}) ` : "";
            descParts.push(`Tel: ${area}${item.sphone}`);
        }
        if (item.snumber)
            descParts.push(`Nº: ${item.snumber}`);
        if (item.pin_loja)
            descParts.push(`PIN: ${item.pin_loja}`);
        if (item.slogo)
            descParts.push(`Logo: ${item.slogo}`);
        const description = descParts.join(" | ") || "Sem descrição";
        return {
            id: String(item.storeid),
            name: item.sname,
            city: item.scity || "Sem Informação",
            description,
            address: address || "Sem endereço",
            active: item.status === 1 || item.status === 0, // Como os totems reais estão com status 0 no banco legado, mapeamos como ativo para visualização no painel
            createdAt: safeIsoDate(item.sdatesince),
            updatedAt: safeIsoDate(item.supdatedate)
        };
    }
    async findAll(filters) {
        console.log('[CollectionPointRepository] Executando findAll no MySQL legado na tabela store com filtros:', filters);
        try {
            const items = await findAllPontosColeta({
                search: filters?.search,
                ativa: filters?.status
            });
            console.log(`[CollectionPointRepository] MySQL (tabela store) retornou ${items.length} registros.`);
            return items.map((item) => this.mapToContract(item));
        }
        catch (err) {
            console.error('[CollectionPointRepository] Erro ao consultar tabela store no MySQL:', err instanceof Error
                ? { name: err.name, message: err.message }
                : String(err));
            throw err;
        }
    }
    async findById(id) {
        console.log(`[CollectionPointRepository] Executando findById no MySQL legado para o ID: ${id}`);
        const seq = Number(id);
        if (isNaN(seq)) {
            console.warn(`[CollectionPointRepository] ID inválido (não numérico): ${id}`);
            return null;
        }
        try {
            const item = await findPontoColetaById(seq);
            if (!item)
                return null;
            return this.mapToContract(item);
        }
        catch (err) {
            console.error(`[CollectionPointRepository] Erro ao buscar loja ${seq} no MySQL:`, err instanceof Error
                ? { name: err.name, message: err.message }
                : String(err));
            throw err;
        }
    }
    async create(data) {
        console.error('[CollectionPointRepository] Tentativa de criação no banco legado (somente leitura)');
        throw new Error("Operações de escrita (criação) não são permitidas no banco de dados legado (somente leitura).");
    }
    async update(id, data) {
        console.error(`[CollectionPointRepository] Tentativa de atualização no banco legado (somente leitura) para o ID: ${id}`);
        throw new Error("Operações de escrita (atualização) não são permitidas no banco de dados legado (somente leitura).");
    }
    async delete(id) {
        console.error(`[CollectionPointRepository] Tentativa de exclusão no banco legado (somente leitura) para o ID: ${id}`);
        throw new Error("Operações de escrita (exclusão) não são permitidas no banco de dados legado (somente leitura).");
    }
}
//# sourceMappingURL=collection-point.repository.js.map