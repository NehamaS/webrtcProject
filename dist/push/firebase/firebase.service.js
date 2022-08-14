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
exports.FirebaseService = exports.HEADER_AUTHORIZATION = void 0;
const common_1 = require("@nestjs/common");
const mculogger_service_1 = require("service-infrastructure/common/logs/mculogger.service");
const admin = __importStar(require("firebase-admin"));
const path = __importStar(require("path"));
const configuration_service_1 = require("service-infrastructure/common/config/configuration.service");
const http = require('http');
exports.HEADER_AUTHORIZATION = "Authorization";
let FirebaseService = class FirebaseService {
    constructor(logger, config) {
        this.logger = logger;
        this.config = config;
    }
    async onModuleInit() {
        this.clientTimerFlag = this.config.get("pushNotification.clientTimerFlag", false);
        this.clientTimer = this.config.get("pushNotification.clientTimer", 300000);
        this.pushTitle = this.config.get("pushNotification.title", "MAVENIR");
        this.pushBody = this.config.get("pushNotification.body", "default");
        this.restcommConfigFlag = this.config.get("pushNotification.restcommConfig", false);
    }
    async getAccountClient(userData) {
        this.logger.debug({ msg: "getAccountClient", userData: userData });
        let appID = userData.accountSid + "_" + userData.appSid;
        let accountClient = this.getClient(appID);
        if (accountClient == undefined) {
            this.logger.debug({ msg: 'create account client:', accountSid: userData.accountSid, appSid: userData.appSid });
            let accountConfig = await this.getAccountConfig(userData);
            if (accountConfig) {
                accountClient = this.createClient(accountConfig, appID);
            }
        }
        return accountClient;
    }
    async getAccountConfig(userData) {
        this.logger.debug({ msg: "getAccountConfig", userData: userData });
        let serviceAccount;
        if (this.restcommConfigFlag == true) {
            serviceAccount = await this.getConfigFromRestcomm(userData);
            return serviceAccount;
        }
        let pathToServiceAccount = path.resolve(`config/projectConfig.json`);
        serviceAccount = require(pathToServiceAccount);
        this.logger.debug({ msg: "getAccountConfig", serviceAccount: serviceAccount });
        return serviceAccount;
    }
    async getConfigFromRestcomm(userData) {
        let serviceAccount = undefined;
        function doRequest(options) {
            return new Promise((resolve, reject) => {
                const req = http.request(options, res => {
                    let body = '';
                    res.on('data', function (chunk) {
                        body += chunk;
                    });
                    res.on('end', function () {
                        serviceAccount = JSON.parse(body);
                        resolve(serviceAccount);
                    });
                });
                req.on('error', error => {
                    reject(error);
                });
                req.end();
            });
        }
        let tokenType = "Bearer ";
        let customDomain = userData.userId.substring(userData.userId.indexOf('@') + 1);
        const options = {
            host: customDomain,
            path: "/restcomm/2012-04-24/Accounts/" + userData.accountSid + "/Applications/" + userData.appSid,
            method: 'GET',
            headers: {
                HEADER_AUTHORIZATION: tokenType + userData.accessToken
            },
        };
        serviceAccount = await doRequest(options);
        this.logger.debug({ msg: "getConfigFromRestcomm", serviceAccount: serviceAccount });
        return serviceAccount;
    }
    async sendNotification(callerUserId, userData) {
        this.logger.info({
            msg: "sendNotification",
            callerUserId: callerUserId,
            userData: userData
        });
        let accountClient = await this.getAccountClient(userData);
        if (accountClient) {
            let message = this.buildNotification(callerUserId, userData.PNSToken);
            try {
                await accountClient.messaging().send(message);
                return true;
            }
            catch (error) {
                this.logger.error('Error', error);
                return false;
            }
        }
        this.logger.error({
            msg: "Failed to send push notification",
            userId: userData.userId,
            callerUserId: callerUserId,
            accountId: userData.accountSid,
            appSid: userData.appSid
        });
        return false;
    }
    buildNotification(callerUserId, registrationToken) {
        let pushBodyString = (this.pushBody == "default") ? callerUserId + ' is calling you' : this.pushBody;
        let message = {
            notification: {
                title: this.pushTitle,
                body: pushBodyString
            },
            token: registrationToken,
        };
        this.logger.info({ msg: "buildNotification", message: message });
        return message;
    }
    createClient(accountConfig, appID) {
        this.logger.debug({ msg: "createClient", appID: appID, accountConfig: accountConfig });
        let accountClient = undefined;
        try {
            accountClient = admin.initializeApp({
                credential: admin.credential.cert(accountConfig)
            }, appID);
            if (accountClient && this.clientTimerFlag == true) {
                this.setClientTimer(appID);
            }
        }
        catch (e) {
            this.logger.error({ msg: "createClient", appID: appID, error: e.message });
            this.logger.error(e);
        }
        return accountClient;
    }
    getClient(appID) {
        this.logger.debug({ msg: "getClient", appID: appID });
        let client = undefined;
        try {
            client = admin.app(appID);
        }
        catch (e) {
            this.logger.info({ msg: "getClient - no client found", appID: appID });
        }
        return client;
    }
    async deleteClient(appID) {
        this.logger.debug({ msg: "deleteClient", appID: appID });
        try {
            await admin.app(appID).delete();
        }
        catch (e) {
            this.logger.info({ msg: "deleteClient - client doesn't exist", appID: appID });
        }
    }
    setClientTimer(appID) {
        setTimeout(async () => {
            this.logger.info({ msg: "clientTimer timer expired for key, delete the client", appID: appID });
            await this.deleteClient(appID);
        }, this.clientTimer);
    }
};
FirebaseService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [mculogger_service_1.MculoggerService,
        configuration_service_1.ConfigurationService])
], FirebaseService);
exports.FirebaseService = FirebaseService;
//# sourceMappingURL=firebase.service.js.map