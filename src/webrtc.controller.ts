import {
    Body,
    Controller, Get,
    HttpCode,
    HttpStatus, Param,
    Post, Query,
    UseGuards,
    UsePipes
} from '@nestjs/common';
import {MculoggerService} from "service-infrastructure/common/logs/mculogger.service";
import {MetricsService} from "service-infrastructure/dd-metrics/metrics.service";
import {ClientMsgHandler} from "./client.msg.handler";
import {WsRequestDto} from "./dto/ws.request.dto";
import {ValidationPipe} from "./common/pipes/validation.pipe";
import {JwtAuthGuard} from "./auth/guards/jwt.auth.guard";
import {ConfigurationService} from "service-infrastructure/common/config/configuration.service";
import {WsDispatcher} from "./ws.dispatcher";
import {a} from "aws-amplify";

const MAX_LOOP = 15

@Controller()
export class WebrtcController {
    constructor(private readonly logger: MculoggerService,
                private readonly msgHandler: ClientMsgHandler,
                private readonly wsDispatcher: WsDispatcher
                ) {
    }

    @Get('/name')
    public getName() {
        this.logger.debug({ServiceName: "WebRTC Gateway"})
        return "WebRTC Gateway";
    }

    @Post('/actions')
    @UsePipes(ValidationPipe)
    @HttpCode(HttpStatus.ACCEPTED)
    async actions(@Body() event: WsRequestDto) {

        this.logger.debug({func: 'actions', body: event});
        await this.msgHandler.handleMsg(event)

        let msg = {
            source: event.dto.source,
            destination: event.dto.destination,
            callId: event.dto.callId,
            messageId: event.dto.messageId,
            action: event.dto.body.action ? event.dto.body.action : event.dto.type
        }
        return msg;
    }

    @Post('connect')
    @UseGuards(JwtAuthGuard)
    public async connect(@Body() body: WsRequestDto) {
        this.logger.debug({action: "connect", body: body})
        return true;
    }

    @Post('disconnect')
    public async disconnect(@Body() body: WsRequestDto) {
        this.logger.debug({action: "disconnect", body: body})
        return await this.msgHandler.wsDisconnect(body.connectionId);
    }
}
