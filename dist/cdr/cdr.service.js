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
exports.CdrService = void 0;
const common_1 = require("@nestjs/common");
const mculogger_service_1 = require("service-infrastructure/common/logs/mculogger.service");
const configuration_service_1 = require("service-infrastructure/common/config/configuration.service");
const constants_1 = require("../common/constants");
const db_service_1 = require("../common/db/db.service");
const rfs = __importStar(require("rotating-file-stream"));
let CdrService = class CdrService {
    constructor(logger, dbService, config) {
        this.logger = logger;
        this.dbService = dbService;
        this.config = config;
    }
    onModuleInit() {
        this.cdrEnable = this.config.get("cdr.enabled", false);
        this.path = this.config.get("cdr.path", './cdr');
        this.filename = this.config.get("cdr.filename", 'cdr.log');
        this.size = this.config.get("cdr.size", '20M');
        this.interval = this.config.get("cdr.interval", '1h');
        this.maxFiles = this.config.get("cdr.maxFiles", 72);
        this.logger.info({ service: 'CdrService', enable: this.cdrEnable, path: this.path, file: this.filename,
            size: this.size, interval: this.interval, maxFiles: this.maxFiles });
        if (!this.cdrEnable) {
            return;
        }
        const pad = num => (num > 9 ? "" : "0") + num;
        const generator = (time, index) => {
            if (!time) {
                return this.filename;
            }
            let month = pad(time.getMonth() + 1) + '.' + time.getFullYear();
            let day = pad(time.getDate());
            let hour = pad(time.getHours());
            let minute = pad(time.getMinutes());
            let sec = pad(time.getSeconds());
            return `${day}.${month}.${hour}.${minute}.${sec}-${index}-` + this.filename;
        };
        this.stream = rfs.createStream(this.filename, {
            path: this.path,
            size: this.size,
            interval: this.interval,
            immutable: true,
            maxFiles: this.maxFiles
        });
    }
    getTime() {
        return new Date().valueOf();
    }
    async setStartTime4SessData(event, callData, sessionData) {
        if (this.cdrEnable && callData.body.reason === constants_1.JOIN_REASON) {
            if (event.dto.body.service && event.dto.body.service == 'P2P') {
                sessionData.startCall = this.getTime();
                sessionData.answerCall = 0;
            }
        }
        await this.dbService.setSessionData(sessionData);
    }
    async setAnswerTime4SessData(event) {
        if (!this.cdrEnable && event.body.service && event.body.service != 'P2P') {
            return;
        }
        let origCallId = event.callId.substring(0, event.callId.indexOf('_leg'));
        let sessionData = await this.dbService.getSessionData(origCallId);
        if (sessionData) {
            sessionData.answerCall = this.getTime();
            await this.dbService.setSessionData(sessionData);
        }
    }
    async getCdrParameters(callId) {
        let sessionData = await this.dbService.getSessionData(callId);
        if (sessionData) {
            let cdr = { caller: sessionData.userId };
            let user = await this.dbService.getByConnectionId(sessionData.connectionId);
            if (user != undefined) {
                cdr.appSid = user.appSid;
                cdr.orgSid = user.organizationSid;
                cdr.accountSid = user.accountSid;
            }
            let endCall = new Date();
            let endCallVal = endCall.valueOf();
            let answerCall = new Date(sessionData.answerCall);
            let answerCallVal = answerCall.valueOf();
            let startCallVal = new Date(sessionData.startCall).valueOf();
            if (answerCallVal != 0) {
                cdr.dateCreated = answerCall.toString();
                cdr.answerCall = answerCall.toJSON();
                cdr.endCall = endCall.toJSON();
                cdr.dateUpdated = endCall.toString();
                cdr.duration = (endCallVal - answerCallVal) / 1000;
                cdr.ringDuration = (answerCallVal - startCallVal) / 1000;
            }
            else {
                cdr.duration = 0;
                cdr.ringDuration = (endCallVal - startCallVal) / 1000;
                cdr.endCall = endCall.toJSON();
                cdr.dateCreated = endCall.toString();
                cdr.dateUpdated = endCall.toString();
            }
            return cdr;
        }
        this.logger.error({ func: 'getCdrParameters', desc: 'get sessionData failed' });
        return undefined;
    }
    async writeCdr(request) {
        if (!this.cdrEnable || request.service != 'P2P' || request.callId.indexOf('_leg') != -1) {
            return;
        }
        let cdr = await this.getCdrParameters(request.callId);
        if (!cdr) {
            this.logger.error({ func: 'printCdr', desc: 'get CDR parameters failed' });
            return;
        }
        cdr.callId = request.callId;
        if (request.callee != cdr.caller) {
            cdr.callee = request.callee;
        }
        else {
            cdr.callee = request.caller;
        }
        if (request.status.code == '200' && cdr.duration == 0) {
            cdr.reason = {
                code: 487,
                message: 'Canceled',
                protocol: 'sip'
            };
        }
        else {
            cdr.reason = {
                code: parseInt(request.status.code, 10),
                message: request.status.desc,
                protocol: 'sip'
            };
            if (parseInt(request.status.code, 10) > 399) {
                cdr.ringDuration = 0;
            }
        }
        cdr.terminator = request.caller;
        this.stream.write(JSON.stringify({
            callId: request.callId,
            date_created: cdr.dateCreated, date_updated: cdr.dateUpdated,
            to: cdr.caller, from: cdr.callee,
            start_time: cdr.answerCall, end_time: cdr.endCall,
            duration: cdr.duration, ring_duration: cdr.ringDuration,
            reason: cdr.reason,
            org_sid: cdr.orgSid,
            account_sid: cdr.accountSid,
            appSid: cdr.appSid,
            terminator: cdr.terminator
        }));
        this.stream.write('\n');
        return cdr;
    }
};
CdrService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [mculogger_service_1.MculoggerService,
        db_service_1.DbService,
        configuration_service_1.ConfigurationService])
], CdrService);
exports.CdrService = CdrService;
//# sourceMappingURL=cdr.service.js.map