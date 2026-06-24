import { PartnerStoreRepository } from "../repositories/partner-store.repository.js";
export class PartnerStoreService {
    app;
    repository;
    constructor(app) {
        this.app = app;
        this.repository = new PartnerStoreRepository();
    }
    list(filters) {
        console.log('[PartnerStoreService] Encaminhando chamada de listagem para o repositório:', filters);
        return this.repository.findAll(filters);
    }
    findById(id) {
        console.log('[PartnerStoreService] Buscando loja parceira por ID:', { id });
        return this.repository.findById(id);
    }
    create(input) {
        console.log('[PartnerStoreService] Tentativa de criar nova loja parceira');
        return this.repository.create(input);
    }
    update(id, input) {
        console.log('[PartnerStoreService] Tentativa de atualizar loja parceira:', { id });
        return this.repository.update(id, input);
    }
    delete(id) {
        console.log('[PartnerStoreService] Tentativa de excluir loja parceira:', { id });
        return this.repository.delete(id);
    }
    listCategories() {
        console.log('[PartnerStoreService] Buscando todas as categorias de parceiros');
        return this.repository.findAllCategories();
    }
}
//# sourceMappingURL=partner-store.service.js.map