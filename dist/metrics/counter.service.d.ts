import { MculoggerService } from "service-infrastructure/common/logs/mculogger.service";
import { CounterType, MetricsService } from 'service-infrastructure/dd-metrics/metrics.service';
import { CounterName } from "../common/constants";
import { ApiGwDto } from "../dto/api.gw.dto";
import { Tags } from 'hot-shots';
export declare class CounterService {
    readonly logger: MculoggerService;
    private readonly metricsService;
    constructor(logger: MculoggerService, metricsService: MetricsService);
    setCounter(counterType: CounterType, counterData: ApiGwDto, value?: number, counterName?: CounterName | string, tag?: Tags): void;
    private getCounterName;
    private setCounterName;
}
