import type { FastifyInstance } from "fastify";
import type { CreatePartnerStoreInput, UpdatePartnerStoreInput } from "@reciclotron/contracts";
import { PartnerStoreRepository } from "../repositories/partner-store.repository.js";

export class PartnerStoreService {
  private repository: PartnerStoreRepository;

  constructor(private app: FastifyInstance) {
    this.repository = new PartnerStoreRepository();
  }

  list(filters?: { search?: string; status?: boolean }) {
    console.log('[PartnerStoreService] Encaminhando chamada de listagem para o repositório:', filters);
    return this.repository.findAll(filters);
  }

  findById(id: string) {
    console.log('[PartnerStoreService] Buscando loja parceira por ID:', { id });
    return this.repository.findById(id);
  }

  create(input: CreatePartnerStoreInput) {
    console.log('[PartnerStoreService] Tentativa de criar nova loja parceira');
    return this.repository.create(input);
  }

  update(id: string, input: UpdatePartnerStoreInput) {
    console.log('[PartnerStoreService] Tentativa de atualizar loja parceira:', { id });
    return this.repository.update(id, input);
  }

  delete(id: string) {
    console.log('[PartnerStoreService] Tentativa de excluir loja parceira:', { id });
    return this.repository.delete(id);
  }

  listCategories() {
    console.log('[PartnerStoreService] Buscando todas as categorias de parceiros');
    return this.repository.findAllCategories();
  }
}
