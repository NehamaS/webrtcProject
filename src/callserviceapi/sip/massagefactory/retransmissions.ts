import {Injectable, forwardRef, Inject} from '@nestjs/common';
import {MculoggerService} from 'service-infrastructure/common/logs/mculogger.service';
import {RestcommDbService} from '../../../common/db/restcomm.db.service';
import {SipService} from "../sip.service";

@Injectable()
export class Retransmissions {
    retransmissionsMap: Map<string, any> = new Map();

    constructor(private readonly logger: MculoggerService,
                private readonly db: RestcommDbService,
                @Inject(forwardRef(() => SipService))  private readonly sipService: SipService) {
        this.logger.verbose("Retransmissions started");
    }

    public async setRetransmissionTimer(response) {
        let callId: string = response.headers['call-id'];

        let toTag: string;
        if (response.headers.to.params != undefined) {
            toTag = response.headers.to.params.tag;
            this.logger.info({msg: 'setRetransmissionTimer function', callId: callId, toTag: toTag});
        }

        let key = callId + '_' + toTag;
        let timeout = 0.5;
        let elapsed  = 0;
        let self = this;

        function _setTimeout() {
            let timer = setTimeout(async () => {
                self.logger.info({ msg: "retransmissions timer expired for key", timer: timeout, key: key});

                elapsed += timeout;
                if (elapsed >= 31.5) {
                    self.logger.error({ msg: "ACK wasn't reseived for key", key: key});
                    self.retransmissionsMap.delete(key);
                    self.printMap(self.retransmissionsMap);
                }
                else {
                     let result : boolean | undefined = await self.db.getAck(key)
                        if(result === true) {
                            self.retransmissionsMap.delete(key);
                            self.printMap(self.retransmissionsMap);
                            await self.db.deleteAck(key);
                        }
                        else {
                            self.logger.info({ msg: "sending retrasmission for key", key: key});
                            self.sipService.sendRetryResponse(response);
                            if (elapsed < 4) {
                                timeout *= 2;
                            }
                            _setTimeout();
                        }

                }
            }, timeout*1000);

            self.retransmissionsMap.set(key, timer);
            self.printMap(self.retransmissionsMap);
        }
        _setTimeout();
    }

    private getRetransmissionTimer(callId, toTag) {
        this.logger.info({ msg: 'getRetransmissionTimer function', callId: callId, toTag: toTag});

        let key = callId + '_' + toTag;
        return this.retransmissionsMap.get(key);
    }

    private cancelRetransmissionTimer(callId, toTag) {
        this.logger.info({ msg: 'cancelRetransmissionTimer function', callId: callId, toTag: toTag});

        let key = callId + '_' + toTag;
        this.logger.info({ msg: 'cancelRetransmissionTimer for key', key: key});
        let timer = this.retransmissionsMap.get(key);
        if(timer) {
            this.retransmissionsMap.delete(key);
            this.printMap(this.retransmissionsMap);
            return true;
        }
        else {
            return false;
        }
    }

    public handleAckRequest(callId, toTag) {
        this.logger.info({ msg: 'handleAckRequest function', callId: callId, toTag: toTag});

        let dbKey = callId + "_" + toTag;
        let timerId = this.getRetransmissionTimer(callId, toTag);
        if(timerId){
            clearTimeout(timerId);
            let deleteFlag = this.cancelRetransmissionTimer(callId, toTag);
            this.logger.info({ msg: "cancelRetransmissionTimer", key: dbKey, deleteFlag: deleteFlag});
        }
        else {
            this.logger.info({ msg: "OnAck: received Ack of another sip, set to DB", key: dbKey});
            this.db.setAck(dbKey, 'true');
        }
    }

    private printMap(printMap) {
        this.logger.info({ msg: '**** print Map ****'});
        let self = this;
        printMap.forEach(function(value, key) {
            self.logger.info({key :key, value: value});
        });
    }
}
