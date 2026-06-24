import { CollectionPointRepository } from "../repositories/collection-point.repository.js";
export class CollectionPointService {
    app;
    repository;
    constructor(app) {
        this.app = app;
        this.repository = new CollectionPointRepository();
    }
    list(filters) {
        console.log('[CollectionPointService] Encaminhando chamada de listagem para o repositório:', filters);
        return this.repository.findAll(filters);
    }
    findById(id) {
        return this.repository.findById(id);
    }
    create(input) {
        return this.repository.create(input);
    }
    update(id, input) {
        return this.repository.update(id, input);
    }
    delete(id) {
        return this.repository.delete(id);
    }
}
//# sourceMappingURL=collection-point.service.js.map