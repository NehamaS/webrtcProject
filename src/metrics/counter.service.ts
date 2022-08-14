import {Injectable} from "@nestjs/common";
import {MculoggerService} from "service-infrastructure/common/logs/mculogger.service";
import {CounterInfo, CounterType, MetricsService} from 'service-infrastructure/dd-metrics/metrics.service'
import {
    CounterName,
    JOIN_REASON,
    START_ACTION,
    STATUS_ACTION, TERMINATE_ACK_ACTION,
    TERMINATE_ACTION
} from "../common/constants";
import {ApiGwDto} from "../dto/api.gw.dto";
import {Tags} from 'hot-shots'
import * as _ from 'lodash'


@Injectable()
export class CounterService {

    constructor(
        readonly logger: MculoggerService,
        private readonly metricsService: MetricsService
    ) {
    }

    setCounter(counterType: CounterType, counterData: ApiGwDto, value: number = 1, counterName?: CounterName | string, tag?: Tags): void {
        setImmediate(async () => { //Sending counters in background without effect the Business logic
            try {

                let name: string = counterName ? counterName : this.getCounterName(counterData)
                if (!name) {
                    this.logger.warn({action: 'setCounter', error: `Counter name is ${name}`, counterData: counterData})
                    return
                }

                let counterInfo: CounterInfo = {
                    counterName: this.setCounterName(name),
                    organizationId: counterData.body.organizationId ? counterData.body.organizationId : undefined,
                    accountId: counterData.body.accountId ? counterData.body.accountId : undefined,
                    appSid: counterData.body.appSid ? counterData.body.appSid : undefined,
                    tag: _.merge({
                        service: counterData.body.service ? counterData.body.service : undefined,
                        deviceType: counterData.body.deviceType ? <string>counterData.body.deviceType : undefined,
                        statusCode: counterData.body.statusCode ? counterData.body.statusCode : undefined
                    }, tag),
                    value: value
                }
                this.logger.debug({counterType: counterType, counterInfo: counterInfo})

                switch (counterType) {
                    case CounterType.incrementCounter:
                        this.metricsService.incrementCounter(counterInfo)
                        return
                    case CounterType.decrementCounter:
                        this.metricsService.decrementCounter(counterInfo)
                        return
                    case CounterType.setCounter:
                        this.metricsService.setCounter(counterInfo)
                        return
                    case CounterType.distributionCounter:
                        this.metricsService.distribution(counterInfo)
                        return
                    case CounterType.histogramCounter:
                        this.metricsService.histogram(counterInfo)
                        return
                    case CounterType.timing:
                        this.metricsService.timing(counterInfo)
                        return
                    case CounterType.gaugeCounter:
                        this.metricsService.gaugeCounter(counterInfo)
                        return
                    default:
                        this.logger.warn({
                            action: 'setCounter',
                            error: `counterType ${counterType} is undefined`,
                            counterInfo: counterInfo,
                            counterData: counterData
                        })
                }
            } catch (e) {
                this.logger.warn({action: 'setCounter', error: e.message(), counterData: counterData})
            }
        })
    }

    private getCounterName(counterData: ApiGwDto): string {
        switch (counterData.body.action) {
            case START_ACTION:
                return (counterData.body.reason === JOIN_REASON || counterData.body.service.toLowerCase() === 'p2p' || counterData.body.service.toLowerCase() === 'a2p') ? CounterName.startCall : undefined
            case STATUS_ACTION:
                if(counterData.body.statusCode && counterData.body.statusCode.startsWith('2')){
                    return CounterName.acceptCall
                } else {
                    return  CounterName.rejectCall
                }
            case TERMINATE_ACTION:
            case TERMINATE_ACK_ACTION:
                return CounterName.endCall
            default:
                this.logger.warn({error: `${counterData.body.action} has no counter name`})
                return undefined
        }
    }

    private setCounterName(counterName : CounterName | string): string {
        return [process.env.SERVICE_NAME, process.env.NODE_ENV, counterName].filter(Boolean).join(".");
    }
}
