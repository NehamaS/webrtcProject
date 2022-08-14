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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CallServiceApiImpl = void 0;
const mculogger_service_1 = require("service-infrastructure/common/logs/mculogger.service");
const restcomm_service_1 = require("./restcomm/restcomm.service");
const one2one_service_1 = require("./one2one/one2one.service");
const common_1 = require("@nestjs/common");
const conference_service_1 = require("./conference/conference.service");
let CallServiceApiImpl = class CallServiceApiImpl {
    constructor(logger, one2OneService, restcommService, conferenceService) {
        this.logger = logger;
        this.one2OneService = one2OneService;
        this.restcommService = restcommService;
        this.conferenceService = conferenceService;
    }
    async makeCall(request) {
        return this.getService(request).makeCall(request);
    }
    updateCall(request) {
        return this.getService(request).updateCall(request);
    }
    endCall(request) {
        return this.getService(request).endCall(request);
    }
    createRoom(request) {
        return this.getService(request).createRoom(request);
    }
    closeRoom(request) {
        return this.getService(request).closeRoom(request);
    }
    addUser(request) {
    }
    updateUser(request) {
    }
    disconnectUser(request) {
    }
    cleanRoom(request) {
    }
    ringingResponse(request) {
        return this.getService(request).ringingResponse(request);
    }
    connectResponse(request) {
        return this.getService(request).connectResponse(request);
    }
    updateResponse(request) {
        return this.getService(request).updateResponse(request);
    }
    updateRejectResponse(request) {
        return this.getService(request).updateResponse(request);
    }
    rejectResponse(request) {
        return this.getService(request).rejectResponse(request);
    }
    endCallResponse(request) {
        return this.getService(request).endCallResponse(request);
    }
    getService(request) {
        if (request.service && request.service == "P2P") {
            console.log({ msg: "getService - one2OneService" });
            return this.one2OneService;
        }
        else if (request.service && request.service == "P2M") {
            console.log({ msg: "getService - conferenceService" });
            return this.conferenceService;
        }
        else {
            console.log({ msg: "getService - restcommService" });
            return this.restcommService;
        }
    }
};
CallServiceApiImpl = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => one2one_service_1.One2OneService))),
    __metadata("design:paramtypes", [mculogger_service_1.MculoggerService,
        one2one_service_1.One2OneService,
        restcomm_service_1.RestcommService,
        conference_service_1.ConferenceService])
], CallServiceApiImpl);
exports.CallServiceApiImpl = CallServiceApiImpl;
//# sourceMappingURL=call.service.api.js.map