import { Socket, Server } from 'socket.io';
import * as ip from "ip";

import {
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnGatewayInit,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer
} from "@nestjs/websockets";
/*
import {DbService} from "../../src/db.service";
import {userInfoDto} from "../../src/dto/userInfoDto";
import {HttpService} from "@nestjs/axios";


 */

@WebSocketGateway(5010, {transports: ['polling','websocket'], serveClient: true})
export class WsApiGw implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {

    private readonly wsIp;

   // constructor (private readonly http: HttpService, private readonly db: DbService) {
    constructor () {
        this.wsIp = ip.address();
        console.log({func: 'UccGwWsController', ip: this.wsIp, port: 5010});
    }

    @WebSocketServer() server: Server;

    @SubscribeMessage('message')
    handleMessage(socket: Socket, data: string): void {
        console.debug('handleMessage: %s', data);
/*
        this.http.post('http://localhost:9001/actions', {
            body: JSON.stringify(data),
            connectionId: socket.id
        });

 */
    }

    afterInit(server: Server) {
        console.debug('afterInit()');
    }

    async handleDisconnect(client: Socket) {
        console.debug('handleDisconnect()');
    }

    async handleConnection(client: Socket, ...args: any[]) {
        //console.log({func: 'handleConnection', id: socket.id});
        console.log({func: 'handleConnection'});

        //let userInfo: userInfoDto = {connectionId: socket.id, accountSid: 'testing', applicationId: 'jest', organizationSid: 'mav'};
        //await this.db.setConnection(socket.id, userInfo);
    }

    async sendMsg(user, msg, ws: Socket) {
        console.log({func: 'sendMsg()', type: 'ws', user: user});
        ws.send(JSON.stringify(msg));
    }

}
