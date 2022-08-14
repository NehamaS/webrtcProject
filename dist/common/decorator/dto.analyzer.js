"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dtoanlayze = void 0;
const common_1 = require("@nestjs/common");
const mculogger_service_1 = require("service-infrastructure/common/logs/mculogger.service");
const configuration_service_1 = require("service-infrastructure/common/config/configuration.service");
const ws_request_dto_1 = require("../../dto/ws.request.dto");
const KIND_MEHTOD = "method";
function dtoanlayze() {
    const injectLogger = (0, common_1.Inject)(mculogger_service_1.MculoggerService);
    const injectConfig = (0, common_1.Inject)(configuration_service_1.ConfigurationService);
    return (target, propertyKey, propertyDescriptor) => {
        injectLogger(target, 'logger');
        injectConfig(target, 'config');
        const originalMethod = propertyDescriptor.value;
        propertyDescriptor.value = async function (...args) {
            this.logger.setContext(target.constructor.name);
            let params = args.map((arg) => {
                if ((arg instanceof ws_request_dto_1.WsRequestDto) ||
                    (!["connectionId", "dto"].some(attr => !Object.prototype.hasOwnProperty.call(arg, attr)))) {
                    this.logger.debug({ action: "dto.analyzer", description: "override from domain" });
                    let allow = this.config.get("auth.domain.allow", true);
                    if (!allow) {
                        let domain = this.config.get("auth.domain.suffix", "webrtc.com");
                        let dto = arg.dto;
                        dto.source = `${dto.source.split("@")[0]}@${domain}`;
                    }
                }
                return arg;
            });
            let result = await originalMethod.apply(this, args);
            return result;
        };
    };
}
exports.dtoanlayze = dtoanlayze;
//# sourceMappingURL=dto.analyzer.js.map