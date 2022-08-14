"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.log = void 0;
const common_1 = require("@nestjs/common");
const mculogger_service_1 = require("service-infrastructure/common/logs/mculogger.service");
const requiredMetadataKey = Symbol("required");
function getParams(func) {
    var str = func.toString();
    str = str.replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\/\/(.)*/g, '')
        .replace(/{[\s\S]*}/, '')
        .replace(/=>/g, '')
        .trim();
    var start = str.indexOf("(") + 1;
    var end = str.length - 1;
    var result = str.substring(start, end).split(", ");
    var params = new Array();
    result.forEach(element => {
        element = element.replace(/=[\s\S]*/g, '').trim();
        if (element.length > 0)
            params.push(element);
    });
    return params;
}
function log(bubble = true, level = "info") {
    const injectLogger = (0, common_1.Inject)(mculogger_service_1.MculoggerService);
    return (target, propertyKey, propertyDescriptor) => {
        injectLogger(target, 'logger');
        const originalMethod = propertyDescriptor.value;
        let data = originalMethod.toString();
        propertyDescriptor.value = async function (...args) {
            try {
                this.logger.setContext(target.constructor.name);
                let params = getParams(originalMethod);
                let parameters = args.map((arg, index) => {
                    let param = {};
                    param[params[index]] = arg;
                    return param;
                });
                this.logger[level](parameters);
                let result = await originalMethod.apply(this, args);
                this.logger[level](result);
                return result;
            }
            catch (error) {
                const logger = this.logger;
                logger.setContext(target.constructor.name);
                logger.error(error.message, error.stack);
                if (bubble) {
                    throw error;
                }
            }
        };
    };
}
exports.log = log;
//# sourceMappingURL=logging.js.map