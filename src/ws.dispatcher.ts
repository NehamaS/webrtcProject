import {forwardRef, Inject, Injectable, OnApplicationBootstrap, OnModuleInit} from "@nestjs/common";
import {MculoggerService} from "service-infrastructure/common/logs/mculogger.service";
import {ApiGwDto} from "./dto/api.gw.dto";
import {AWS_API_VERSION, NO_CONNECTION} from "./common/constants";
import {ConfigurationService} from "service-infrastructure/common/config/configuration.service";
import {HttpService} from '@nestjs/axios';
import {AxiosRequestConfig} from 'axios';
import {lastValueFrom, map} from 'rxjs';
import {WsRequestDto} from "./dto/ws.request.dto";
import retry from "async-retry"
import AWS = require('aws-sdk');
import AWSMock = require('aws-sdk-mock');
import {DbService} from "./common/db/db.service";
import {UserDataDto} from "./dto/user.data.dto";
import * as _ from 'lodash'
import {WssAdmin} from "./websocket/admin/wss.admin";

@Injectable()
//export class WsDispatcher implements OnModuleInit, OnApplicationBootstrap {
export class WsDispatcher implements OnApplicationBootstrap {
    private apiGwManagementApi: AWS.ApiGatewayManagementApi;
    private useWsInterface: boolean;

    constructor(private readonly logger: MculoggerService,
                private readonly config: ConfigurationService,
                private readonly dbService: DbService,
                private readonly httpService: HttpService,
                @Inject(forwardRef(() => WssAdmin)) private readonly wsAdmin: WssAdmin) {
        console.debug('WsDispatcher');
    }

    onApplicationBootstrap() {
        this.useWsInterface = this.config.get("websocket.ws.enabled", false);
        if (this.useWsInterface) {
            this.logger.info({service: 'WsDispatcher', desc: 'use local ws'});
            //return;
        }
        else {
            this.useWsInterface = this.config.get("websocket.wss.enabled", false);
            if (this.useWsInterface) {
                this.logger.info({service: 'WsDispatcher', desc: 'use local wss'});
                //return;
            }
        }

        let aws_ws_url = this.config.get('aws.webSocketUrl', process.env.AWS_WEB_SOCKET_URL);
        if (!aws_ws_url) {
            console.error({func: 'WsDispatcher', err: 'process.env.AWS_WEB_SOCKET_URL Not Defined'})
            return;
        }

        let aws_region = this.config.get('aws.region', process.env.AWS_API_GW_REGION);
        if (!aws_region) {
            console.error({func: 'WsDispatcher', err: 'process.env.AWS_REGION Not Defined'})
            return;
        }

        AWS.config.update({region: aws_region});

        let aws_mock: boolean = this.config.get('aws.mock.ws', false);
        this.logger.warn({msg: "Using AWS Mock?", useAwsMock: aws_mock});
        if (aws_mock) {
            let aws_mock_http: boolean = this.config.get('aws.mock.http', true);
            let mock_aws_ws_url: string = this.config.get('aws.mock.webSocketUrl');
            let full_component_test: boolean = this.config.get('aws.mock.fullComponentTest');

            this.logger.warn({msg: "Using AWS Mock?", useAwsMock: aws_mock, url: mock_aws_ws_url});
            this.logger.warn({msg: "Mocking aws WS api gw"});
            AWSMock.setSDKInstance(AWS);
            AWSMock.mock('ApiGatewayManagementApi', 'postToConnection', async (params: { ConnectionId: string, Data: ApiGwDto }, callback: Function) => {
                this.logger.info({
                    service: 'ApiGatewayManagementApi',
                    method: 'postToConnection',
                    status: 'mock called'
                });
                if (full_component_test){
                    const urlArray: Array<string> = mock_aws_ws_url.split(":");
                    const action = urlArray[2].split("/")[1];
                    const port = params.ConnectionId.slice(-4);
                    mock_aws_ws_url = `${urlArray[0]}:${urlArray[1]}:${port}/${action}`;
                }
                if (aws_mock_http) {

                    const requestConfig: AxiosRequestConfig = {
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    };
                    try {
                        // let mock_aws_ws_url : string = this.config.get('aws.mock.webSocketUrl');
                        this.logger.info(`POST TO CONNECTION MOCK  => ${mock_aws_ws_url}, ==> ${params.ConnectionId}, ==> ${params.Data}`)
                        const responseData = await lastValueFrom(
                            this.httpService.post(mock_aws_ws_url, <WsRequestDto>{
                                connectionId: params.ConnectionId,
                                dto: params.Data
                            }, requestConfig).pipe(map((response) => {
                                    return response.data;
                                }),
                            ),
                        );
                        callback(responseData);
                        return;
                    } catch (e) {
                        this.logger.error(e.message)
                        throw new Error("PostToConnection mock failed!!  ");
                    }

                } else {
                    callback(undefined, {StatusCode: 200})
                    return
                }
            });

        }

        this.apiGwManagementApi = new AWS.ApiGatewayManagementApi({
            apiVersion: AWS_API_VERSION,
            endpoint: aws_ws_url
        });

    }

    public async sendMessage(wsConnectionId: string, msg: ApiGwDto): Promise<void> {
        try {
            this.logger.info({func: 'sendMessage', connection: wsConnectionId, msg: msg});

            let retries: number = Number(this.config.get("sendWsMessage.retries", 2));
            let minTimeout: number = Number(this.config.get("sendWsMessage.minTimeout", 30000));
            let index: number = 0

            await retry(async () => await this.sendWsMessage(wsConnectionId, msg, index), {
                retries: retries,
                minTimeout: minTimeout,
                onRetry: (error, attempt) => {
                    index = attempt
                }
            });

        } catch (e) {
            this.logger.error({Action: 'Dispatcher sendMessage', error: e.message ? e.message : e})
        }
    }

    private async sendWsMessage(wsConnectionId: string, msg: ApiGwDto, index: number): Promise<void> {
        try {
            let connectionId: string = wsConnectionId

            this.logger.debug({action: 'sendWsMessage retry', index: index, conn: wsConnectionId, msg: msg})
            if (index > 0) {
                if (msg && msg.body && msg.body.userId && msg.body.deviceId) {
                    let userData: UserDataDto = await this.dbService.getUserData(msg.body.userId, msg.body.deviceId)
                    connectionId = userData && userData.connectionId ? userData.connectionId : wsConnectionId
                }
                // else if (msg.source){
                //     let userDataArr: Array<UserDataDto> = await this.dbService.getByUserId(source)
                //     if (Array.isArray(userDataArr) && userDataArr.length !== 0) {
                //         let userData: UserDataDto = userDataArr.find(data => {
                //             if (data && data.connectionId && data.connectionId !== NO_CONNECTION) {
                //                 connectionId = data.connectionId;
                //                 return
                //             }
                //         });
                //     }
                // }
            }
            this.logger.debug({action: 'sendWsMessage', connectionId: connectionId, index: index})

            let message: ApiGwDto = this.clearMsg(msg)

            if (this.useWsInterface && connectionId.indexOf('_ws_') != -1) {
                await this.sendMessage2WsInterface(connectionId, message);
                return;
            }

            await this.apiGwManagementApi.postToConnection({
                ConnectionId: connectionId,
                Data: JSON.stringify(message)
            }).promise()
                .then(data => {
                    this.logger.debug({action: 'Dispatcher sendWsMessaged', data: data});
                })
                .catch(error => {
                    this.logger.error({
                        action: 'Dispatcher sendWsMessaged',
                        connectionId: connectionId,
                        index: index,
                        error: error
                    })
                    throw new Error(error.message ? error.message : error)
                })
        } catch (e) {
            this.logger.error({func: 'sendMessage to webSocket GW failed', msg: e.message ? e.message : e});
            throw new Error(e.message ? e.message : e)
        }
    }

    public async sendMessage2WsInterface(wsConnId: string, msg: ApiGwDto): Promise<void> {
        this.logger.info({func: 'sendMessage2WsInterface', wsConnId: wsConnId, msg: msg})
        await this.wsAdmin.sendMessage(wsConnId, msg);
    }

    private clearMsg(msg: ApiGwDto): ApiGwDto { //Deleted unnecessary parameters
        let message: ApiGwDto = _.cloneDeep(msg)
        delete message.body.deviceId
        delete message.body.userId
        delete message.body.accessToken
        delete message.body.appSid
        delete message.body.organizationId
        delete message.body.accountId
        delete message.body.deviceType
        return message
    }
}
