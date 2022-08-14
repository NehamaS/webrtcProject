"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConferenceModule = void 0;
const common_1 = require("@nestjs/common");
const conference_service_1 = require("./conference.service");
const webrtc_module_1 = require("../../webrtc.module");
const db_module_1 = require("../../common/db/db.module");
const sip_module_1 = require("../sip/sip.module");
let ConferenceModule = class ConferenceModule {
};
ConferenceModule = __decorate([
    (0, common_1.Module)({
        imports: [(0, common_1.forwardRef)(() => sip_module_1.SipModule), (0, common_1.forwardRef)(() => webrtc_module_1.WebrtcModule), db_module_1.DbModule],
        providers: [conference_service_1.ConferenceService],
        exports: [conference_service_1.ConferenceService]
    })
], ConferenceModule);
exports.ConferenceModule = ConferenceModule;
//# sourceMappingURL=conference.module.js.map