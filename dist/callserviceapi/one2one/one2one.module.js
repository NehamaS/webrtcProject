"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.One2oneModule = void 0;
const common_1 = require("@nestjs/common");
const one2one_service_1 = require("../one2one/one2one.service");
const webrtc_module_1 = require("../../webrtc.module");
let One2oneModule = class One2oneModule {
};
One2oneModule = __decorate([
    (0, common_1.Module)({
        imports: [(0, common_1.forwardRef)(() => webrtc_module_1.WebrtcModule)],
        providers: [one2one_service_1.One2OneService],
        exports: [one2one_service_1.One2OneService]
    })
], One2oneModule);
exports.One2oneModule = One2oneModule;
//# sourceMappingURL=one2one.module.js.map