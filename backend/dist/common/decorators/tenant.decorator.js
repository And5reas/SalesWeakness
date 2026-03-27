"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantId = void 0;
const common_1 = require("@nestjs/common");
exports.TenantId = (0, common_1.createParamDecorator)((_data, ctx) => {
    const req = ctx.switchToHttp().getRequest();
    return req.tenantId;
});
//# sourceMappingURL=tenant.decorator.js.map