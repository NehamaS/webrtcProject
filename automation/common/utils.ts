import {DeviceType} from "./factory";
import {ActionType} from "./messages/factory";


export function rstring(port?: number) {
  +new Date();
  const timestemp = new Date().getTime(),
    random = Math.floor(Math.random() * 1e4).toString();
  return port? timestemp + random + port: timestemp + random;
}

export function random(min, max) {
  return Math.floor(
      Math.random() * (max - min) + min
  )
}


export const wait = async (ms: number): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function strToDeviceType(type: string): DeviceType {
  switch (type.toLowerCase()) {
    case "android":
      return DeviceType.ANDROID;
    case "ios":
      return DeviceType.IOS;
    case "web-browser":
      return DeviceType.WEB_BROWSER;
    case "web-desktop":
      return DeviceType.WEB_DESKTOP;
    default:
      throw new Error(`Unsupported device type [${type}]`);
  }
}

export function actionTypeToStr(type: ActionType): string {
  switch (type) {
    case ActionType.REGISTER:
      return "Register";
    case ActionType.START_CALL:
      return "Start_Call";   //      RTCGW-196    return "Start call";
    case ActionType.END_CALL:
      return "End call";
    case ActionType.ANSWER:
      return "Answer";
    case ActionType.REJECT:
      return "Reject";
    case ActionType.END_CALL_BY_USER_B:
      return "End call by user B";
    case ActionType.TERMINATE_ACK:
      return "TerminateAck";
    case ActionType.RINGING:
      return "Ringing";
    case ActionType.UNREGISTER:
      return "Unregister";
    case ActionType.OPEN_ROOM:
      return "OpenRoom";
    case ActionType.START_MCU_CALL:
      return "StartMcuCall"
    default:
      throw new Error(`Unsupported action type ${type}`);
  }
}

export function StrToactionType(type: string): ActionType {
  switch (type) {
    case "Register":
      return ActionType.REGISTER;
    case "Start call":
      return ActionType.START_CALL;
    case "End call":
      return ActionType.END_CALL;
    case "Answer":
      return ActionType.ANSWER;
    case "Reject":
      return ActionType.REJECT;
    case "Unregister":
      return ActionType.UNREGISTER;
    default:
      throw new Error(`Unsupported action type ${type}`);
  }
}

export function strToAction(type: string): string {
  switch (type) {
    case "Normal":
    case "OK":
      return "Terminate";
    case "Ringing":
      return "Ringing";
    case "Not Found":
      return "Not Found";
    case "Not found":
      return "Not found";
    case "Reject":
      return "Reject";
    case "Unregister":
      return "Unregister";
    default:
      throw new Error(`Unsupported action type ${type}`);
  }
}
