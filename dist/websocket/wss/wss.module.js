"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WssModule = void 0;
const common_1 = require("@nestjs/common");
const wss_controller_1 = require("./wss.controller");
const wss_admin_module_1 = require("../admin/wss.admin.module");
const webrtc_module_1 = require("../../webrtc.module");
let WssModule = class WssModule {
};
WssModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        imports: [wss_admin_module_1.WssAdminModule, (0, common_1.forwardRef)(() => webrtc_module_1.WebrtcModule)],
        providers: [wss_controller_1.WssController],
        exports: [wss_controller_1.WssController]
    })
], WssModule);
exports.WssModule = WssModule;
//# sourceMappingURL=wss.module.js.map