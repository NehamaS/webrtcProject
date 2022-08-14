import {Injectable} from "@nestjs/common";
import {MculoggerService} from "service-infrastructure/common/logs/mculogger.service";
import {ConfigurationService} from "service-infrastructure/common/config/configuration.service";
import {WsRequestDto} from "../dto/ws.request.dto";
import {ApiGwDto} from "../dto/api.gw.dto";
import {SessionDto} from "../dto/session.dto";
import {JOIN_REASON} from "../common/constants";
import {GwCdrDto} from "../dto/gw.cdr.dto";
import {UserDataDto} from "../dto/user.data.dto";
import {ApiGwFormatDto} from "../dto/apiGwFormatDto";
import {DbService} from "../common/db/db.service";

import * as rfs from "rotating-file-stream";

@Injectable()
export class CdrService {
    private cdrEnable: boolean;
    private path: string;
    private filename: string;
    private size: string;
    private interval: string;
    private maxFiles: number;
    private stream;

    constructor(private readonly logger: MculoggerService,
                private readonly dbService: DbService,
                private readonly config: ConfigurationService) {
    }

    onModuleInit(): any {
        this.cdrEnable = this.config.get("cdr.enabled", false);
        this.path = this.config.get("cdr.path", './cdr');
        this.filename = this.config.get("cdr.filename", 'cdr.log');
        this.size = this.config.get("cdr.size", '20M');
        this.interval = this.config.get("cdr.interval", '1h');
        this.maxFiles = this.config.get("cdr.maxFiles", 72);

        this.logger.info({service: 'CdrService', enable: this.cdrEnable, path: this.path, file: this.filename,
                        size: this.size, interval: this.interval, maxFiles: this.maxFiles});

        if (!this.cdrEnable) {
            return;
        }

        const pad = num => (num > 9 ? "" : "0") + num;
        const generator = (time, index) => {

            if (!time) {
                return this.filename;
            }

            let month = pad(time.getMonth() + 1) + '.' +  time.getFullYear();
            let day = pad(time.getDate());
            let hour = pad(time.getHours());
            let minute = pad(time.getMinutes());
            let sec = pad(time.getSeconds());

            return `${day}.${month}.${hour}.${minute}.${sec}-${index}-`+ this.filename;
        };

        //this.stream = rfs.createStream(generator(new Date(), 0), {

        // look as:
        // 20220615-1455-01-cdr.log
        // 20220615-1455-02-cdr.log
        this.stream = rfs.createStream(this.filename, {
            path: this.path,
            size: this.size,
            interval: this.interval,
            immutable: true,
            maxFiles: this.maxFiles
        });

    }

    public getTime(): number {
        // expected output: 823230245000
        return new Date().valueOf();
    }

    public async setStartTime4SessData(event: WsRequestDto, callData: ApiGwDto, sessionData: SessionDto) {
        if (this.cdrEnable && callData.body.reason === JOIN_REASON) {
            if(event.dto.body.service && event.dto.body.service == 'P2P') {
                sessionData.startCall = this.getTime();
                sessionData.answerCall = 0;
            }
        }
        await this.dbService.setSessionData(sessionData);
    }

    public async setAnswerTime4SessData(event: ApiGwDto) {
        if(!this.cdrEnable && event.body.service && event.body.service != 'P2P') {
            return;
        }

        let origCallId: string = event.callId.substring(0, event.callId.indexOf('_leg'));
        let sessionData: SessionDto = await this.dbService.getSessionData(origCallId);
        if (sessionData) {
            sessionData.answerCall = this.getTime();
            await this.dbService.setSessionData(sessionData);
        }
    }

    public async getCdrParameters(callId: string) : Promise<GwCdrDto> {
        let sessionData: SessionDto = await this.dbService.getSessionData(callId);
        if (sessionData) {

            let cdr: GwCdrDto = {caller: sessionData.userId};

            let user: UserDataDto = await this.dbService.getByConnectionId(sessionData.connectionId);
            if (user != undefined) {
                cdr.appSid = user.appSid;
                cdr.orgSid = user.organizationSid;
                cdr.accountSid = user.accountSid;
            }

            let endCall: Date = new Date();
            let endCallVal: number = endCall.valueOf();

            let answerCall: Date = new Date(sessionData.answerCall);
            let answerCallVal: number = answerCall.valueOf();

            let startCallVal: number = new Date(sessionData.startCall).valueOf();

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

        this.logger.error({func: 'getCdrParameters', desc: 'get sessionData failed'});
        return undefined;
    }

    public async writeCdr(request: ApiGwFormatDto) : Promise<GwCdrDto>{
        if (!this.cdrEnable || request.service != 'P2P' || request.callId.indexOf('_leg') != -1) {
            return;
        }

        let cdr: GwCdrDto = await this.getCdrParameters(request.callId);
        if (!cdr) {
            this.logger.error({func: 'printCdr', desc: 'get CDR parameters failed'});
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

            // reject call
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

                // not implemented
                /*
                sid: 'sid-xxx',
                instance_id: 'inst-id-yyy',
                conference_sid: '',
                direction: 'inbound',
                answered_by: '',
                api_version: '2012-04-24',
                caller_name: '',
                uri: 'uri-xxx',
                 */

                // our
                appSid: cdr.appSid,
                terminator: cdr.terminator
            })
        );

        this.stream.write('\n');
        return cdr;
    }

}