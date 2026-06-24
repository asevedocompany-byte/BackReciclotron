export class AdminUserService {
    app;
    constructor(app) {
        this.app = app;
    }
    async list() {
        const users = await this.app.container.repositories.adminUsers.findAll();
        return users.map(({ id, email, name, role, lastLoginAt, createdAt, updatedAt }) => ({
            id,
            email,
            name,
            role,
            lastLoginAt,
            createdAt,
            updatedAt
        }));
    }
}
//# sourceMappingURL=admin-user.service.js.map