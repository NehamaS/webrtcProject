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
exports.Retransmissions = void 0;
const common_1 = require("@nestjs/common");
const mculogger_service_1 = require("service-infrastructure/common/logs/mculogger.service");
const restcomm_db_service_1 = require("../../../common/db/restcomm.db.service");
const sip_service_1 = require("../sip.service");
let Retransmissions = class Retransmissions {
    constructor(logger, db, sipService) {
        this.logger = logger;
        this.db = db;
        this.sipService = sipService;
        this.retransmissionsMap = new Map();
        this.logger.verbose("Retransmissions started");
    }
    async setRetransmissionTimer(response) {
        let callId = response.headers['call-id'];
        let toTag;
        if (response.headers.to.params != undefined) {
            toTag = response.headers.to.params.tag;
            this.logger.info({ msg: 'setRetransmissionTimer function', callId: callId, toTag: toTag });
        }
        let key = callId + '_' + toTag;
        let timeout = 0.5;
        let elapsed = 0;
        let self = this;
        function _setTimeout() {
            let timer = setTimeout(async () => {
                self.logger.info({ msg: "retransmissions timer expired for key", timer: timeout, key: key });
                elapsed += timeout;
                if (elapsed >= 31.5) {
                    self.logger.error({ msg: "ACK wasn't reseived for key", key: key });
                    self.retransmissionsMap.delete(key);
                    self.printMap(self.retransmissionsMap);
                }
                else {
                    let result = await self.db.getAck(key);
                    if (result === true) {
                        self.retransmissionsMap.delete(key);
                        self.printMap(self.retransmissionsMap);
                        await self.db.deleteAck(key);
                    }
                    else {
                        self.logger.info({ msg: "sending retrasmission for key", key: key });
                        self.sipService.sendRetryResponse(response);
                        if (elapsed < 4) {
                            timeout *= 2;
                        }
                        _setTimeout();
                    }
                }
            }, timeout * 1000);
            self.retransmissionsMap.set(key, timer);
            self.printMap(self.retransmissionsMap);
        }
        _setTimeout();
    }
    getRetransmissionTimer(callId, toTag) {
        this.logger.info({ msg: 'getRetransmissionTimer function', callId: callId, toTag: toTag });
        let key = callId + '_' + toTag;
        return this.retransmissionsMap.get(key);
    }
    cancelRetransmissionTimer(callId, toTag) {
        this.logger.info({ msg: 'cancelRetransmissionTimer function', callId: callId, toTag: toTag });
        let key = callId + '_' + toTag;
        this.logger.info({ msg: 'cancelRetransmissionTimer for key', key: key });
        let timer = this.retransmissionsMap.get(key);
        if (timer) {
            this.retransmissionsMap.delete(key);
            this.printMap(this.retransmissionsMap);
            return true;
        }
        else {
            return false;
        }
    }
    handleAckRequest(callId, toTag) {
        this.logger.info({ msg: 'handleAckRequest function', callId: callId, toTag: toTag });
        let dbKey = callId + "_" + toTag;
        let timerId = this.getRetransmissionTimer(callId, toTag);
        if (timerId) {
            clearTimeout(timerId);
            let deleteFlag = this.cancelRetransmissionTimer(callId, toTag);
            this.logger.info({ msg: "cancelRetransmissionTimer", key: dbKey, deleteFlag: deleteFlag });
        }
        else {
            this.logger.info({ msg: "OnAck: received Ack of another sip, set to DB", key: dbKey });
            this.db.setAck(dbKey, 'true');
        }
    }
    printMap(printMap) {
        this.logger.info({ msg: '**** print Map ****' });
        let self = this;
        printMap.forEach(function (value, key) {
            self.logger.info({ key: key, value: value });
        });
    }
};
Retransmissions = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, common_1.Inject)((0, common_1.forwardRef)(() => sip_service_1.SipService))),
    __metadata("design:paramtypes", [mculogger_service_1.MculoggerService,
        restcomm_db_service_1.RestcommDbService,
        sip_service_1.SipService])
], Retransmissions);
exports.Retransmissions = Retransmissions;
//# sourceMappingURL=retransmissions.js.map