import type { FastifyInstance } from "fastify";
import type { CreateCollectionPointInput, UpdateCollectionPointInput } from "@reciclotron/contracts";
import { CollectionPointRepository } from "../repositories/collection-point.repository.js";

export class CollectionPointService {
  private repository: CollectionPointRepository;

  constructor(private app: FastifyInstance) {
    this.repository = new CollectionPointRepository();
  }

  list(filters?: { search?: string; status?: boolean }) {
    console.log('[CollectionPointService] Encaminhando chamada de listagem para o repositório:', filters);
    return this.repository.findAll(filters);
  }

  findById(id: string) {
    return this.repository.findById(id);
  }

  create(input: CreateCollectionPointInput) {
    return this.repository.create(input);
  }

  update(id: string, input: UpdateCollectionPointInput) {
    return this.repository.update(id, input);
  }

  delete(id: string) {
    return this.repository.delete(id);
  }
}
