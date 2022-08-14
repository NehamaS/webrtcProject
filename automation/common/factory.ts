import {REJECT_RESPONSE, NO_ANSWER_RESPONSE, BUSY_RESPONSE, OK_RESPONSE, NOT_FOUND_RESPONSE} from "./constants";

export enum SipMethod {
   CREATE_INVITE,
   CREATE_BYE
}

export enum DeviceType {
   ANDROID,
   IOS,
   WEB_BROWSER,
   WEB_DESKTOP,
}

export const errorCodes = new Map<string, number>([
   [OK_RESPONSE, 200],
   [BUSY_RESPONSE, 403],
   [REJECT_RESPONSE, 500],
   [NO_ANSWER_RESPONSE, 408],
   [NOT_FOUND_RESPONSE, 404],
]);


export const SipHeaders: { ALLOW: string; PMAV_ERROR: string; CALL_ID: string } = {
   ALLOW: "Allow",
   PMAV_ERROR: "P-Mav-Error-Description",
   CALL_ID: "call-id",
};
