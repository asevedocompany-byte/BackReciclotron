export class AudienceSegmentService {
    app;
    constructor(app) {
        this.app = app;
    }
    list() { return this.app.container.repositories.audienceSegments.findAll(); }
    create(input) { return this.app.container.repositories.audienceSegments.create(input); }
    async resolveRecipients(segmentId) {
        const users = await this.app.container.repositories.endUsers.findAll();
        if (!segmentId)
            return users;
        const segment = (await this.app.container.repositories.audienceSegments.findAll()).find((item) => item.id === segmentId);
        if (!segment)
            return [];
        return users.filter((user) => (!segment.city || user.city === segment.city) &&
            (!segment.status || user.status === segment.status) &&
            (segment.minimumPoints === undefined || user.pointsBalance >= segment.minimumPoints) &&
            (segment.maximumPoints === undefined || user.pointsBalance <= segment.maximumPoints));
    }
}
//# sourceMappingURL=audience-segment.service.js.map