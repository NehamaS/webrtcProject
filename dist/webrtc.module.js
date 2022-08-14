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
exports.WebrtcModule = void 0;
const common_1 = require("@nestjs/common");
const webrtc_controller_1 = require("./webrtc.controller");
const infrastructure_module_1 = require("service-infrastructure/infrastructure.module");
const auth_module_1 = require("./auth/auth.module");
const client_msg_handler_1 = require("./client.msg.handler");
const db_module_1 = require("./common/db/db.module");
const ws_dispatcher_1 = require("./ws.dispatcher");
const restcomm_module_1 = require("./callserviceapi/restcomm/restcomm.module");
const axios_1 = require("@nestjs/axios");
const validators_module_1 = require("./common/validators/validators.module");
const validation_pipe_1 = require("./common/pipes/validation.pipe");
const error_builder_1 = require("./common/error.builder");
const ready_service_1 = require("service-infrastructure/health/ready.service");
const health_service_1 = require("service-infrastructure/health/health.service");
const cpu_service_1 = require("service-infrastructure/health/cpu/cpu.service");
const memory_rss_service_1 = require("service-infrastructure/health/memory/memory.rss.service");
const call_service_api_module_1 = require("./callserviceapi/call.service.api.module");
const one2one_module_1 = require("./callserviceapi/one2one/one2one.module");
const accesslog_service_1 = require("./common/middleware/accesslog.service");
const push_notification_module_1 = require("./push/push.notification.module");
const cdr_service_1 = require("./cdr/cdr.service");
const wss_module_1 = require("./websocket/wss/wss.module");
const ws_module_1 = require("./websocket/ws/ws.module");
const hotshouts_module_1 = require("service-infrastructure/dd-metrics/hotshouts.module");
const counter_service_1 = require("./metrics/counter.service");
const conference_module_1 = require("./callserviceapi/conference/conference.module");
let WebrtcModule = class WebrtcModule {
    constructor(healthService, readyService, cpuService, memoryRssService) {
        this.healthService = healthService;
        this.readyService = readyService;
        this.cpuService = cpuService;
        this.memoryRssService = memoryRssService;
    }
    configure(consumer) {
        consumer.apply(accesslog_service_1.AccesslogService).forRoutes(webrtc_controller_1.WebrtcController);
    }
    onModuleInit() {
        this.healthService.setProbs([], true);
        this.readyService.setProbs([this.memoryRssService], true);
    }
};
WebrtcModule = __decorate([
    (0, common_1.Module)({
        imports: [infrastructure_module_1.InfrastructureModule, hotshouts_module_1.DataDogModule, push_notification_module_1.PushNotificationModule, (0, common_1.forwardRef)(() => one2one_module_1.One2oneModule), (0, common_1.forwardRef)(() => auth_module_1.AuthModule), conference_module_1.ConferenceModule,
            restcomm_module_1.RestcommModule, call_service_api_module_1.CallServiceApiModule, db_module_1.DbModule, axios_1.HttpModule, validators_module_1.ValidatorsModule, ws_module_1.WsModule, wss_module_1.WssModule],
        controllers: [webrtc_controller_1.WebrtcController],
        providers: [client_msg_handler_1.ClientMsgHandler, ws_dispatcher_1.WsDispatcher, validation_pipe_1.ValidationPipe, error_builder_1.ErrorBuilder, memory_rss_service_1.MemoryRssService, cdr_service_1.CdrService, counter_service_1.CounterService],
        exports: [client_msg_handler_1.ClientMsgHandler, counter_service_1.CounterService]
    }),
    __metadata("design:paramtypes", [health_service_1.HealthService,
        ready_service_1.ReadyService,
        cpu_service_1.CpuService,
        memory_rss_service_1.MemoryRssService])
], WebrtcModule);
exports.WebrtcModule = WebrtcModule;
//# sourceMappingURL=webrtc.module.js.map