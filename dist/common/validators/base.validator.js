"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseValidator = void 0;
const mculogger_service_1 = require("service-infrastructure/common/logs/mculogger.service");
const common_1 = require("@nestjs/common");
let BaseValidator = class BaseValidator {
    constructor(logger) {
        this.logger = logger;
    }
    validate(dto) {
        return;
    }
    propValidate(propertyList, body) {
        propertyList.forEach(property => {
            if (!body.hasOwnProperty(property)) {
                this.action(property);
            }
        });
    }
    action(property) {
        this.logger.error({ action: this.name, error: `incorrect request, missing ${property}` });
        throw new Error(`[${this.name}] missing ${property}`);
    }
};
BaseValidator = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [mculogger_service_1.MculoggerService])
], BaseValidator);
exports.BaseValidator = BaseValidator;
//# sourceMappingURL=base.validator.js.map