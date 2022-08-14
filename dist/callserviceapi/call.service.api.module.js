"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CallServiceApiModule = void 0;
const common_1 = require("@nestjs/common");
const restcomm_module_1 = require("./restcomm/restcomm.module");
const call_service_api_1 = require("./call.service.api");
const one2one_module_1 = require("./one2one/one2one.module");
const conference_module_1 = require("./conference/conference.module");
const sip_module_1 = require("./sip/sip.module");
let CallServiceApiModule = class CallServiceApiModule {
};
CallServiceApiModule = __decorate([
    (0, common_1.Module)({
        imports: [restcomm_module_1.RestcommModule, (0, common_1.forwardRef)(() => one2one_module_1.One2oneModule), conference_module_1.ConferenceModule, (0, common_1.forwardRef)(() => sip_module_1.SipModule)],
        providers: [call_service_api_1.CallServiceApiImpl],
        exports: [call_service_api_1.CallServiceApiImpl]
    })
], CallServiceApiModule);
exports.CallServiceApiModule = CallServiceApiModule;
//# sourceMappingURL=call.service.api.module.js.map