import {Injectable, OnModuleInit} from '@nestjs/common';
import {MculoggerService} from "service-infrastructure/common/logs/mculogger.service";
import * as admin from "firebase-admin";
import * as path from 'path';
import {ConfigurationService} from "service-infrastructure/common/config/configuration.service";
import {UserDataDto} from "../../dto/user.data.dto";
const http = require('http');
export const HEADER_AUTHORIZATION = "Authorization";


@Injectable()
export class FirebaseService implements  OnModuleInit {

    private clientTimerFlag: boolean;
    private clientTimer: number;
    private pushTitle: string;
    private pushBody: string;
    private restcommConfigFlag: boolean;


    constructor (private readonly logger: MculoggerService,
                private readonly config: ConfigurationService) {
    }

    public async onModuleInit() {
        this.clientTimerFlag = this.config.get("pushNotification.clientTimerFlag", false);
        this.clientTimer = this.config.get("pushNotification.clientTimer", 300000);
        this.pushTitle = this.config.get("pushNotification.title", "MAVENIR");
        this.pushBody = this.config.get("pushNotification.body", "default");
        this.restcommConfigFlag = this.config.get("pushNotification.restcommConfig", false);
    }

    public async getAccountClient(userData: UserDataDto): Promise<any>{
        this.logger.debug({msg: "getAccountClient", userData: userData});

        let appID: string = userData.accountSid + "_" + userData.appSid;

        let accountClient = this.getClient(appID);
        if(accountClient == undefined) {
            this.logger.debug({ msg: 'create account client:',accountSid: userData.accountSid, appSid: userData.appSid });
            let accountConfig: string = await this.getAccountConfig(userData);
            if(accountConfig) {
                accountClient = this.createClient(accountConfig, appID);
            }
        }
        return accountClient;
    }

    public async getAccountConfig(userData: UserDataDto): Promise<any> {
        this.logger.debug({msg: "getAccountConfig", userData: userData});
        let serviceAccount: string;
        if (this.restcommConfigFlag == true) {
            serviceAccount = await this.getConfigFromRestcomm(userData);
            return serviceAccount;
        }

        // get account config from config file
        let pathToServiceAccount = path.resolve(`config/projectConfig.json`);
        serviceAccount = require(pathToServiceAccount);
        this.logger.debug({msg: "getAccountConfig", serviceAccount: serviceAccount});

        return serviceAccount;
    }

    public async getConfigFromRestcomm(userData: UserDataDto): Promise<any> {
        let serviceAccount: any = undefined;

        function doRequest(options): Promise<string> {
            return new Promise ((resolve, reject) => {
                const req = http.request(options, res => {
                    let body =''
                    res.on('data', function(chunk) {
                        body += chunk;
                    });
                    res.on('end', function() {
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

        let tokenType: string = "Bearer ";
        let customDomain: string = userData.userId.substring(userData.userId.indexOf('@') + 1);
        const options = {
            host: customDomain,
            //hostname: '127.0.0.1',
            //port: 8085,
            path: "/restcomm/2012-04-24/Accounts/" + userData.accountSid + "/Applications/" + userData.appSid,
            method: 'GET',
            headers: {
                HEADER_AUTHORIZATION: tokenType + userData.accessToken
            },
        };

        serviceAccount = await doRequest(options);
        this.logger.debug({msg: "getConfigFromRestcomm", serviceAccount: serviceAccount});
        return serviceAccount;
    }


    public async sendNotification(callerUserId: string, userData: UserDataDto): Promise<boolean> {
        this.logger.info({
            msg: "sendNotification",
            callerUserId: callerUserId,
            userData: userData
        });

        let accountClient: any = await this.getAccountClient(userData);
        if (accountClient) {
            let message: admin.messaging.TokenMessage = this.buildNotification(callerUserId, userData.PNSToken);
            try {
                await accountClient.messaging().send(message);
                return true;
            } catch (error) {
                //this.logger.error('Error sending push notification:', error.errorInfo.message);
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

    public buildNotification (callerUserId: string, registrationToken: string): admin.messaging.TokenMessage {

        let pushBodyString: string = (this.pushBody == "default") ? callerUserId + ' is calling you' : this.pushBody;
        let message: admin.messaging.TokenMessage = {
            notification: {
                title: this.pushTitle,
                body: pushBodyString
            },
            token: registrationToken,
        }

        this.logger.info({msg: "buildNotification", message: message});
        return message;
    }


    public createClient(accountConfig: any, appID: string) {
        this.logger.debug({msg: "createClient", appID: appID, accountConfig: accountConfig});

        let accountClient: any = undefined;
        try {
            accountClient = admin.initializeApp({
                credential: admin.credential.cert(accountConfig)
            }, appID);
            if (accountClient && this.clientTimerFlag == true) {
                this.setClientTimer(appID);
            }
        } catch (e) {
            this.logger.error({msg: "createClient", appID: appID, error: e.message});
            this.logger.error(e);
        }
        return accountClient;
    }

    private getClient(appID: string) {
        this.logger.debug({msg: "getClient", appID: appID});

        let client: any = undefined;
        try {
            client = admin.app(appID);
        } catch (e) {
            this.logger.info({msg: "getClient - no client found", appID: appID});
        }
        return client;
    }

    public async deleteClient(appID: string) {
        this.logger.debug({msg: "deleteClient", appID: appID});

        try {
            await admin.app(appID).delete();
        } catch (e) {
            this.logger.info({msg: "deleteClient - client doesn't exist", appID: appID});
        }
    }

    public setClientTimer(appID: string) {
        setTimeout(async () => {
            this.logger.info({msg: "clientTimer timer expired for key, delete the client", appID: appID});

            await this.deleteClient(appID);

        }, this.clientTimer);
    }
}
