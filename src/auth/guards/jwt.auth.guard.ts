import {CanActivate, ExecutionContext, HttpStatus, Injectable, Request} from '@nestjs/common';
import {HttpArgumentsHost} from "@nestjs/common/interfaces";
import jwt_decode, {JwtPayload} from 'jwt-decode';
import {MculoggerService} from "service-infrastructure/common/logs/mculogger.service";
import {TOKEN} from "../token";
import {DbService} from "../../common/db/db.service";
import {
    ACCESS_TOKEN,
    APP_SID,
    AUTH_HEADER,
    CONNECTION_ID,
    CounterName,
    DEVICE_ID,
    USER_ID
} from "../../common/constants";
import {ConfigurationService} from "service-infrastructure/common/config/configuration.service";
import {UserDataDto} from "../../dto/user.data.dto";
import {CounterService} from "../../metrics/counter.service";
import {CounterType} from "service-infrastructure/dd-metrics/metrics.service";
import {ApiGwDto} from "../../dto/api.gw.dto";

@Injectable()
export class JwtAuthGuard implements CanActivate {

    constructor(private readonly logger: MculoggerService,
                private readonly dbService: DbService,
                private readonly config: ConfigurationService,
                private readonly counterService: CounterService
    ) {
    }

    public async canActivate(context: ExecutionContext): Promise<boolean> {
        try {


            let enabled: boolean = this.config.get("auth.token.use", true);
            if (!enabled) {
                this.logger.warn({"auth.token.use": enabled, description: "skipping token validation/parsing"});
                //skip auth token parsing
                return true;
            }

            let ctx: HttpArgumentsHost = context.switchToHttp();
            const request: Request = ctx.getRequest<Request>();
            let d = AUTH_HEADER;
            let token = (request.headers ? request.headers[d] : undefined) ||
                        request.body[d] ||
                        (request["query"] ? request["query"][d] : undefined);
            if (!token) {
                token = request.headers[d.toLowerCase()];
            }

            if (token) {
                let userData: UserDataDto = this.parseToken(token);
                if (!userData) {
                    let counterData: ApiGwDto = {
                        source: undefined,
                        destination: undefined,
                        ts: undefined,
                        callId: undefined,
                        type: undefined,
                        messageId: undefined,
                        meetingId: undefined,
                        body: {
                            appSid: undefined,
                            statusCode: HttpStatus.BAD_REQUEST.toString()
                        }
                    }
                    this.counterService.setCounter(CounterType.incrementCounter, counterData, 1, CounterName.wsConnectionRejected )
                    return false;
                }

                //Attach connection id to user
                userData.connectionId = request.body[CONNECTION_ID];

                //validate existing mandatory parameters!
                this.validateParams(userData)
                await this.saveToDB(userData);
                let counterData: ApiGwDto = {
                    source: undefined,
                    destination: undefined,
                    ts: undefined,
                    callId: undefined,
                    type: undefined,
                    messageId: undefined,
                    meetingId: undefined,
                    body: {
                        appSid: userData.appSid,
                        accountId: userData.accountSid,
                        organizationId: userData.accountSid,
                        statusCode: HttpStatus.OK.toString()
                    }
                }
                this.counterService.setCounter(CounterType.incrementCounter, counterData, 1, CounterName.wsConnectionAccepted )
                return true;
            }
            this.logger.error("Auth token is missing!!");
            return false
        } catch (e) {
            this.logger.error({action: 'canActivate', error: e.message})
            return false
        }
    }

    private async saveToDB(data: UserDataDto): Promise<void> {
        try {
            let persis: boolean = this.config.get("auth.token.persist", false);
            if (persis) {
                let userData: UserDataDto = await this.dbService.getUserData(data.userId, data.deviceId)
                if (userData) {
                    await this.dbService.updateUsersData(userData)
                } else {
                    await this.dbService.setUser(data);
                }
            } else {
                this.logger.warn({action: `JwtAuthGuard saveToDB`, message: 'persist configured as false, Guard does not save the data '})
            }
        } catch (e) {
            this.logger.error({action: 'JwtAuthGuard saveToDB', error: e.message})
        }

    }

    private parseToken (jwt: any): UserDataDto {
        try {
            let jwtPayload: JwtPayload = jwt_decode<JwtPayload>(jwt);
            this.logger.verbose(jwtPayload);

            let userData: UserDataDto = new UserDataDto();
            userData.userId = jwtPayload[TOKEN.USER_ID]
            userData.deviceId = jwtPayload[TOKEN.DEVICE_ID]
            userData.accessToken = jwt
            userData.organizationSid = jwtPayload[TOKEN.ORGANIZATION];
            userData.accountSid = jwtPayload[TOKEN.ACCOUNT];
            userData.appSid = jwtPayload[TOKEN.APPLICATION_SID]

            this.logger.info({action: 'parseToken', userData: userData});
            return userData;
        } catch (e) {
            this.logger.error({info: "Invalid token", error: e.message ? e.message : e});
            return undefined;
        }

    }

    private validateParams(userData: UserDataDto): void {
        let parameters: Array<string> = [ACCESS_TOKEN, CONNECTION_ID, APP_SID, DEVICE_ID, USER_ID]
        parameters.map(param => {
            if (!userData[param]) {
                this.logger.error({action: "validateParams", error: `${param} is missing in jwt!!`});
                throw new Error(`${param} is missing in jwt!!`)
            }
        })
    }
}

