"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageFactoryModule = void 0;
const common_1 = require("@nestjs/common");
const message_factory_1 = require("./message.factory");
const retransmissions_1 = require("./retransmissions");
const sip_module_1 = require("../sip.module");
const msml_factory_1 = require("./msml.factory");
let MessageFactoryModule = class MessageFactoryModule {
};
MessageFactoryModule = __decorate([
    (0, common_1.Module)({
        imports: [(0, common_1.forwardRef)(() => sip_module_1.SipModule)],
        providers: [message_factory_1.MessageFactory, retransmissions_1.Retransmissions, msml_factory_1.MsmlFactory],
        exports: [message_factory_1.MessageFactory, retransmissions_1.Retransmissions, msml_factory_1.MsmlFactory]
    })
], MessageFactoryModule);
exports.MessageFactoryModule = MessageFactoryModule;
//# sourceMappingURL=message.factory.module.js.map