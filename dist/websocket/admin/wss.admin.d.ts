import { ApiGwDto } from "../../dto/api.gw.dto";
import * as WebSocket from 'ws';
export declare class WssAdmin {
    private wsConnMap;
    constructor();
    onConnect(req: any, wss: WebSocket): void;
    onMessage(req: any, wss: WebSocket, msg: string): void;
    onClose(req: any, wss: WebSocket): void;
    createConnId(req: any): string;
    sendMessage(connId: string, msg: ApiGwDto): Promise<void>;
}
