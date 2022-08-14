"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SipModule = void 0;
const common_1 = require("@nestjs/common");
const sip_service_1 = require("./sip.service");
const message_factory_1 = require("./massagefactory/message.factory");
const restcomm_module_1 = require("../restcomm/restcomm.module");
const retransmissions_1 = require("./massagefactory/retransmissions");
const db_module_1 = require("../../common/db/db.module");
const sip_utils_1 = require("./common/sip.utils");
const msml_factory_1 = require("./massagefactory/msml.factory");
let SipModule = class SipModule {
};
SipModule = __decorate([
    (0, common_1.Module)({
        imports: [(0, common_1.forwardRef)(() => restcomm_module_1.RestcommModule), db_module_1.DbModule],
        providers: [sip_service_1.SipService, message_factory_1.MessageFactory, msml_factory_1.MsmlFactory, retransmissions_1.Retransmissions, sip_utils_1.SipUtils],
        exports: [sip_service_1.SipService, message_factory_1.MessageFactory, msml_factory_1.MsmlFactory, retransmissions_1.Retransmissions, sip_utils_1.SipUtils]
    })
], SipModule);
exports.SipModule = SipModule;
//# sourceMappingURL=sip.module.js.map