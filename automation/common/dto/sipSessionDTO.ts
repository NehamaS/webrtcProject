import { Uri, ContactDTO } from "./sipMessageDTO";
import { WsRequestDto } from "./ws.request.dto";
import { WsService } from "../ws/ws.service";
import WebSocket = require('ws');
import {uuid} from "aws-sdk/clients/customerprofiles";



export class Session {
  public srcUser: string = "";
  public via: string;
  public toTag: string;
  public inviteTimeout: number = 0;
  public destUser: string = "";
  public connectionId: string = "";
  public callId: string = "";
  public meetingId: string=""
  public messageId: string = "0";
  public to: ContactDTO = <ContactDTO>{};
  public from: ContactDTO = <ContactDTO>{};
  public destContact: any;
  public seqNumber: number = <number>{};
  public destination: string = <string>"";
  public source: string = <string>"";
  public OrganizationSid: string = <string>"";
  public AccountSid: string = <string>"";
  public AppSid: string = <string>"";
  public deviceType: "ANDROID" | "IOS" | "WEB_BROWSER" | "WEB_DESKTOP"
  public sdp: string = <string>"";
  public deviceId: string = "";
  public createResponses = new Response();
  public wsResponse: WsRequestDto = <WsRequestDto>{};
  public description: string = "";
  public action: string = "";
  public wsClient: WebSocket;
  public wsSrv: WsService;
  public cognito:Cognito = <Cognito>{}
  public token:IUserToken=<IUserToken>{}
  public restcommApplication:RestcommApplication=<RestcommApplication>{}
  public userId: string = "";
  public PNSToken: uuid;
}

export class Response {
  public Register: any = <WsRequestDto>{};
  public Unregister: any = <WsRequestDto>{};
  public Start_Call: any = <WsRequestDto>{};
  public End_Call: any = <WsRequestDto>{};
  public Ringing: any = <WsRequestDto>{};
  public Reject_Call: WsRequestDto = <WsRequestDto>{};
  public Terminate: WsRequestDto = <WsRequestDto>{};
}

export interface SystemParams {
  system: string;
  deviceType: "ANDROID" | "IOS" | "WEB_BROWSER" | "WEB_DESKTOP";
  feature: string;
  service: "P2A" | "P2P";
}

export interface TestParams {
  restcommRes: string;
  timeOut: string;
  errorCase: boolean;
}

export interface DeviceTypeList {
  ANDROID: string;
  WEB: string;
  IPHONE: string;
}

export interface Cognito {
  AccountId: string,
  AccountToken: string,
  userPoolId:string
  userPoolWebClientId:string
}

export interface RestcommApplication {
  appSid: string
}

export interface CognitoDetails {
  name:string;
  cognito: Cognito
  restcommApplication: RestcommApplication
}

export interface IUserToken {
  accessToken: string;
  refreshToken: string;
  idToken: string;
}

export interface Participant {
  srcUser:string;
  destUser:string;
}
