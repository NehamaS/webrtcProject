import {forwardRef, MiddlewareConsumer, Module, NestModule, OnModuleInit, RequestMethod} from '@nestjs/common';
import {WebrtcController} from './webrtc.controller';
import {InfrastructureModule} from "service-infrastructure/infrastructure.module";
import {AuthModule} from './auth/auth.module';
import {ClientMsgHandler} from "./client.msg.handler";
import {DbModule} from "./common/db/db.module";
import {WsDispatcher} from "./ws.dispatcher";
import {RestcommModule} from "./callserviceapi/restcomm/restcomm.module";
import {HttpModule} from '@nestjs/axios';
import {ValidatorsModule} from "./common/validators/validators.module";
import {ValidationPipe} from "./common/pipes/validation.pipe";
import {ErrorBuilder} from "./common/error.builder";
import {ReadyService} from "service-infrastructure/health/ready.service";
import {HealthService} from "service-infrastructure/health/health.service";
import {CpuService} from "service-infrastructure/health/cpu/cpu.service";
import {MemoryRssService} from "service-infrastructure/health/memory/memory.rss.service";
import {CallServiceApiModule} from "./callserviceapi/call.service.api.module";
import {One2oneModule} from "./callserviceapi/one2one/one2one.module";
import {AccesslogService} from "./common/middleware/accesslog.service";
import {PushNotificationModule} from "./push/push.notification.module";
import {CdrService} from "./cdr/cdr.service";
import {WssModule} from "./websocket/wss/wss.module";
import {WsModule} from "./websocket/ws/ws.module";
import {DataDogModule} from "service-infrastructure/dd-metrics/hotshouts.module";
import {CounterService} from "./metrics/counter.service";
import {ConferenceModule} from "./callserviceapi/conference/conference.module";

@Module({
     imports: [InfrastructureModule, DataDogModule, PushNotificationModule, forwardRef(() => One2oneModule), forwardRef(() => AuthModule), ConferenceModule,
        RestcommModule, CallServiceApiModule, DbModule, HttpModule, ValidatorsModule, WsModule, WssModule],
    controllers: [WebrtcController],
    providers: [ClientMsgHandler, WsDispatcher, ValidationPipe, ErrorBuilder, MemoryRssService, CdrService, CounterService],
    exports: [ClientMsgHandler, CounterService]
})

export class WebrtcModule implements OnModuleInit, NestModule {
    constructor(private readonly healthService: HealthService,
                private readonly readyService: ReadyService,
                private readonly cpuService: CpuService,
                private readonly memoryRssService: MemoryRssService) {
    }

    public configure(consumer: MiddlewareConsumer) {
        consumer.apply(AccesslogService).forRoutes(WebrtcController);
    }

    onModuleInit(): any {
        this.healthService.setProbs ( [], true ) //Decided to remove healthService probs in this project
        this.readyService.setProbs ( [ this.memoryRssService ], true )
    }
}
