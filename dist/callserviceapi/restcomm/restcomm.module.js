"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RestcommModule = void 0;
const common_1 = require("@nestjs/common");
const restcomm_service_1 = require("./restcomm.service");
const sip_module_1 = require("../sip/sip.module");
const webrtc_module_1 = require("../../webrtc.module");
const db_module_1 = require("../../common/db/db.module");
let RestcommModule = class RestcommModule {
};
RestcommModule = __decorate([
    (0, common_1.Module)({
        imports: [(0, common_1.forwardRef)(() => sip_module_1.SipModule), (0, common_1.forwardRef)(() => webrtc_module_1.WebrtcModule), db_module_1.DbModule],
        providers: [restcomm_service_1.RestcommService],
        exports: [restcomm_service_1.RestcommService]
    })
], RestcommModule);
exports.RestcommModule = RestcommModule;
//# sourceMappingURL=restcomm.module.js.map