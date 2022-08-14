import { Controller, HttpCode, Post, HttpStatus, Body} from '@nestjs/common';
import {MculoggerService} from "service-infrastructure/common/logs/mculogger.service";
import {FirebaseService} from "./firebase.service";
import {httpRequestDto} from "./data.message";

@Controller()
export class FirebaseController {
    constructor(private readonly logger: MculoggerService,
                private readonly firebaseService: FirebaseService) {
    }

    @Post('/push')
    @HttpCode(HttpStatus.ACCEPTED)
    async push(@Body() event: httpRequestDto) {

        this.logger.info({func: 'actions', body: event});

        await this.firebaseService.sendNotification(event.callerUserId, event.userData);
        return true;
    }
}