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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtAuthGuard = void 0;
const common_1 = require("@nestjs/common");
const jwt_decode_1 = __importDefault(require("jwt-decode"));
const mculogger_service_1 = require("service-infrastructure/common/logs/mculogger.service");
const token_1 = require("../token");
const db_service_1 = require("../../common/db/db.service");
const constants_1 = require("../../common/constants");
const configuration_service_1 = require("service-infrastructure/common/config/configuration.service");
const user_data_dto_1 = require("../../dto/user.data.dto");
const counter_service_1 = require("../../metrics/counter.service");
const metrics_service_1 = require("service-infrastructure/dd-metrics/metrics.service");
let JwtAuthGuard = class JwtAuthGuard {
    constructor(logger, dbService, config, counterService) {
        this.logger = logger;
        this.dbService = dbService;
        this.config = config;
        this.counterService = counterService;
    }
    async canActivate(context) {
        try {
            let enabled = this.config.get("auth.token.use", true);
            if (!enabled) {
                this.logger.warn({ "auth.token.use": enabled, description: "skipping token validation/parsing" });
                return true;
            }
            let ctx = context.switchToHttp();
            const request = ctx.getRequest();
            let d = constants_1.AUTH_HEADER;
            let token = (request.headers ? request.headers[d] : undefined) ||
                request.body[d] ||
                (request["query"] ? request["query"][d] : undefined);
            if (!token) {
                token = request.headers[d.toLowerCase()];
            }
            if (token) {
                let userData = this.parseToken(token);
                if (!userData) {
                    let counterData = {
                        source: undefined,
                        destination: undefined,
                        ts: undefined,
                        callId: undefined,
                        type: undefined,
                        messageId: undefined,
                        meetingId: undefined,
                        body: {
                            appSid: undefined,
                            statusCode: common_1.HttpStatus.BAD_REQUEST.toString()
                        }
                    };
                    this.counterService.setCounter(metrics_service_1.CounterType.incrementCounter, counterData, 1, constants_1.CounterName.wsConnectionRejected);
                    return false;
                }
                userData.connectionId = request.body[constants_1.CONNECTION_ID];
                this.validateParams(userData);
                await this.saveToDB(userData);
                let counterData = {
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
                        statusCode: common_1.HttpStatus.OK.toString()
                    }
                };
                this.counterService.setCounter(metrics_service_1.CounterType.incrementCounter, counterData, 1, constants_1.CounterName.wsConnectionAccepted);
                return true;
            }
            this.logger.error("Auth token is missing!!");
            return false;
        }
        catch (e) {
            this.logger.error({ action: 'canActivate', error: e.message });
            return false;
        }
    }
    async saveToDB(data) {
        try {
            let persis = this.config.get("auth.token.persist", false);
            if (persis) {
                let userData = await this.dbService.getUserData(data.userId, data.deviceId);
                if (userData) {
                    await this.dbService.updateUsersData(userData);
                }
                else {
                    await this.dbService.setUser(data);
                }
            }
            else {
                this.logger.warn({ action: `JwtAuthGuard saveToDB`, message: 'persist configured as false, Guard does not save the data ' });
            }
        }
        catch (e) {
            this.logger.error({ action: 'JwtAuthGuard saveToDB', error: e.message });
        }
    }
    parseToken(jwt) {
        try {
            let jwtPayload = (0, jwt_decode_1.default)(jwt);
            this.logger.verbose(jwtPayload);
            let userData = new user_data_dto_1.UserDataDto();
            userData.userId = jwtPayload[token_1.TOKEN.USER_ID];
            userData.deviceId = jwtPayload[token_1.TOKEN.DEVICE_ID];
            userData.accessToken = jwt;
            userData.organizationSid = jwtPayload[token_1.TOKEN.ORGANIZATION];
            userData.accountSid = jwtPayload[token_1.TOKEN.ACCOUNT];
            userData.appSid = jwtPayload[token_1.TOKEN.APPLICATION_SID];
            this.logger.info({ action: 'parseToken', userData: userData });
            return userData;
        }
        catch (e) {
            this.logger.error({ info: "Invalid token", error: e.message ? e.message : e });
            return undefined;
        }
    }
    validateParams(userData) {
        let parameters = [constants_1.ACCESS_TOKEN, constants_1.CONNECTION_ID, constants_1.APP_SID, constants_1.DEVICE_ID, constants_1.USER_ID];
        parameters.map(param => {
            if (!userData[param]) {
                this.logger.error({ action: "validateParams", error: `${param} is missing in jwt!!` });
                throw new Error(`${param} is missing in jwt!!`);
            }
        });
    }
};
JwtAuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [mculogger_service_1.MculoggerService,
        db_service_1.DbService,
        configuration_service_1.ConfigurationService,
        counter_service_1.CounterService])
], JwtAuthGuard);
exports.JwtAuthGuard = JwtAuthGuard;
//# sourceMappingURL=jwt.auth.guard.js.map