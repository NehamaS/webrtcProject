"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CounterService = void 0;
const common_1 = require("@nestjs/common");
const mculogger_service_1 = require("service-infrastructure/common/logs/mculogger.service");
const metrics_service_1 = require("service-infrastructure/dd-metrics/metrics.service");
const constants_1 = require("../common/constants");
const _ = __importStar(require("lodash"));
let CounterService = class CounterService {
    constructor(logger, metricsService) {
        this.logger = logger;
        this.metricsService = metricsService;
    }
    setCounter(counterType, counterData, value = 1, counterName, tag) {
        setImmediate(async () => {
            try {
                let name = counterName ? counterName : this.getCounterName(counterData);
                if (!name) {
                    this.logger.warn({ action: 'setCounter', error: `Counter name is ${name}`, counterData: counterData });
                    return;
                }
                let counterInfo = {
                    counterName: this.setCounterName(name),
                    organizationId: counterData.body.organizationId ? counterData.body.organizationId : undefined,
                    accountId: counterData.body.accountId ? counterData.body.accountId : undefined,
                    appSid: counterData.body.appSid ? counterData.body.appSid : undefined,
                    tag: _.merge({
                        service: counterData.body.service ? counterData.body.service : undefined,
                        deviceType: counterData.body.deviceType ? counterData.body.deviceType : undefined,
                        statusCode: counterData.body.statusCode ? counterData.body.statusCode : undefined
                    }, tag),
                    value: value
                };
                this.logger.debug({ counterType: counterType, counterInfo: counterInfo });
                switch (counterType) {
                    case metrics_service_1.CounterType.incrementCounter:
                        this.metricsService.incrementCounter(counterInfo);
                        return;
                    case metrics_service_1.CounterType.decrementCounter:
                        this.metricsService.decrementCounter(counterInfo);
                        return;
                    case metrics_service_1.CounterType.setCounter:
                        this.metricsService.setCounter(counterInfo);
                        return;
                    case metrics_service_1.CounterType.distributionCounter:
                        this.metricsService.distribution(counterInfo);
                        return;
                    case metrics_service_1.CounterType.histogramCounter:
                        this.metricsService.histogram(counterInfo);
                        return;
                    case metrics_service_1.CounterType.timing:
                        this.metricsService.timing(counterInfo);
                        return;
                    case metrics_service_1.CounterType.gaugeCounter:
                        this.metricsService.gaugeCounter(counterInfo);
                        return;
                    default:
                        this.logger.warn({
                            action: 'setCounter',
                            error: `counterType ${counterType} is undefined`,
                            counterInfo: counterInfo,
                            counterData: counterData
                        });
                }
            }
            catch (e) {
                this.logger.warn({ action: 'setCounter', error: e.message(), counterData: counterData });
            }
        });
    }
    getCounterName(counterData) {
        switch (counterData.body.action) {
            case constants_1.START_ACTION:
                return (counterData.body.reason === constants_1.JOIN_REASON || counterData.body.service.toLowerCase() === 'p2p' || counterData.body.service.toLowerCase() === 'a2p') ? constants_1.CounterName.startCall : undefined;
            case constants_1.STATUS_ACTION:
                if (counterData.body.statusCode && counterData.body.statusCode.startsWith('2')) {
                    return constants_1.CounterName.acceptCall;
                }
                else {
                    return constants_1.CounterName.rejectCall;
                }
            case constants_1.TERMINATE_ACTION:
            case constants_1.TERMINATE_ACK_ACTION:
                return constants_1.CounterName.endCall;
            default:
                this.logger.warn({ error: `${counterData.body.action} has no counter name` });
                return undefined;
        }
    }
    setCounterName(counterName) {
        return [process.env.SERVICE_NAME, process.env.NODE_ENV, counterName].filter(Boolean).join(".");
    }
};
CounterService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [mculogger_service_1.MculoggerService,
        metrics_service_1.MetricsService])
], CounterService);
exports.CounterService = CounterService;
//# sourceMappingURL=counter.service.js.map