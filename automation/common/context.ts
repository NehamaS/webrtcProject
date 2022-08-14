import {ContactDTO, Uri} from "./dto/sipMessageDTO";
import {Session} from "./dto/sipSessionDTO";
import { WsService } from "./ws/ws.service";
import { ApiFactory } from "./api/api.factory";
import WebSocket = require('ws');

export class Context {

    public env: string;
    public toTag = "";
    public currentTest = "";
    public inviteResponse = "";
    public inviteTimeout = 0;
    public errorCase: boolean;
    public errorCaseResponse: {status: number , reason: string} = {status: 0, reason: ""};
    public collee = "";
    public coller = "";
    public callId = "";
    public accessToken = "";
    public OrganizationSid = "";
    public AccountSid = "";
    public AppSid = "";
    public to:  ContactDTO = <ContactDTO>{};
    public from: ContactDTO = <ContactDTO>{};
    public destContact: any;
    public seqNumber: number = <number>{};
    public sdp: string = "";
    public source: string = "";
    public destination: string = "";
    public featureType: string = "";
    public url: string = "";
    public api: ApiFactory;
    public cpaasAppUrl: string = "";
    public service: "P2A" | "P2P";
    public messageId: string = "";
    private sessions: Map<string, Session> = new Map<string, Session>();

    public setSession(userId: string, session: Session) {
        this.sessions.set(userId, session);
    }
    public getSession(userId: string): Session| undefined {
        return this.sessions.get(userId);
    }


    get current() {
        return this.currentTest;
    }
    set current(name:string) {
        this.currentTest = name;
    }

    public address(): string {
        return this.env;
    }
}

export class LoadContext {
    public MultiContext: Array<Context> = new Array<Context>();
    public numOfSessions=0
    public succeedsResult=0
    public threshold=10
    public failuresResult=0
    public cpaasAddress = "";

}
