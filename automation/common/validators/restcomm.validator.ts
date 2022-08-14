
import { RequestDTO, ResponseDTO,ValidateErrorMassage } from "../dto/sipMessageDTO";
import { Context } from "../context";
import { SipUtils } from "../dto/sip.utils";

import {
  METHOD_ACK, METHOD_INVITE,
  METHOD_BYE,
  NO_ANSWER_RESPONSE,
  BUSY_RESPONSE,
  REJECT_RESPONSE,
  OK_RESPONSE,
  RESTCOM_PORT,
  WebTRCGW_PORT,
  LOCAL_HOST,
    USER,
    PORT,
    HOST,
    TO,
    FROM,
    CONTACT,
    TAG,
    URI,
    CALL_ID,
    CSEQ,
    SEQ,
    METHOD
} from "../constants";

import { SipURI } from "../../../src/callserviceapi/sip/common/sip.utils";
import {Session} from "../dto/sipSessionDTO";

const utils: SipUtils = new SipUtils();

export const IncomingRequestValidate = async (messageValidateMeta: any, session: Session, context: Context): Promise<Boolean> => {
  return new Promise<Boolean>((resolve, reject) => {
    setTimeout(async () => {
      let validateErrMsg: ValidateErrorMassage = new class implements ValidateErrorMassage {
        header: string;
        method: string;
        part: string;
      }
      validateErrMsg.method=`Incoming ${messageValidateMeta.method}`
      try {
        let request: RequestDTO | undefined;
        const receivedMessages: Map<string, Array<RequestDTO>> = global["received"];
        request = receivedMessages?.get(`${session.callId}_${messageValidateMeta.method}_${session.from.uri}`)?.pop();

        global.logger.info({
          test:  global.logger["context"].current,
          step:IncomingRequestValidate.name,
          action: `waiting ~ ${messageValidateMeta.interval} sec for ${messageValidateMeta.method} message`
        });
        if (request?.method) {
          const mainUriObj: SipURI = utils.parseUri(request.uri);
          const toUriObj: SipURI = utils.parseUri(request.headers.to.uri);
          const fromUriObj: SipURI = utils.parseUri(request.headers.from.uri);
          const uriUriObj: SipURI = utils.parseUri(request.headers.contact[0].uri);


        await fromHeaderValidate(session, validateErrMsg, fromUriObj)
        await toHeaderValidate(session, validateErrMsg, toUriObj)
        await contactHeaderValidate(session, validateErrMsg, uriUriObj)
        await uriHeaderValidate(session, validateErrMsg, mainUriObj)


          validateErrMsg.header=CALL_ID
          expect(request.headers["call-id"]).toEqual(session.callId);
          validateErrMsg.header=CSEQ
          validateErrMsg.part=METHOD
          expect(request.headers.cseq.method).toEqual(request.method);
          validateErrMsg.part=TAG
          expect(request.headers.from.params.tag).toBeDefined();


          switch (messageValidateMeta.method) {
            case METHOD_INVITE:
              await validateInvite(request, session, validateErrMsg);
              return resolve(true);
            case METHOD_BYE:
              await validateByeAndAck(request, session, validateErrMsg,2);
              return resolve(true);
            case METHOD_ACK:
              await validateByeAndAck(request, session, validateErrMsg,1);
              return resolve(true);
          }
        } else {
          const errMsg = `Failed to receive ${messageValidateMeta.method} message `;

          global.logger.error({
            test:  global.logger["context"].current,
            step:IncomingRequestValidate.name,
            error: errMsg
          });
          return reject(errMsg);
        }
      }
      catch(e)
      {
        return reject(new Error(e));
      }
    }, messageValidateMeta.interval * 1000);

  });
};

export const IncomingResponseValidate = async (request: RequestDTO, response: ResponseDTO): Promise<void> => {


  expect(response.status).toEqual(200)
  expect ((response.reason).toLocaleUpperCase()).toEqual(OK_RESPONSE)
  expect(response.headers.to).toEqual(request.headers.to)
  expect(response.headers.from).toEqual(request.headers.from)
  expect(response.headers.cseq).toEqual(request.headers.cseq)
  expect(response.headers["call-id"]).toEqual(request.headers["call-id"])

};

export const validateInvite = (request: RequestDTO, session: Session, validateErrMsg: ValidateErrorMassage): void => {
  validateErrMsg.header=CONTACT
  expect(request.content?.length).toBeGreaterThan(1);
  validateErrMsg.header=CSEQ
  validateErrMsg.part=SEQ
  expect(request.headers.cseq.seq).toEqual(1);
};

export const validateByeAndAck = ( request: RequestDTO, session: Session, validateErrMsg: ValidateErrorMassage, cseqValue: Number): void => {
  validateErrMsg.header=CSEQ
  validateErrMsg.part=SEQ
  expect(request.headers.cseq.seq).toEqual(cseqValue);
  validateErrMsg.header=TO
  validateErrMsg.part=TAG
  expect(request.headers.to.params.tag).toEqual(session.toTag);
};

export const fromHeaderValidate = (session: Session, validateErrMsg: ValidateErrorMassage, fromUriObj): void => {
  validateErrMsg.header=FROM
  validateErrMsg.part=USER
  expect(fromUriObj.user).toEqual(session.srcUser);
};

export const toHeaderValidate = (session: Session, validateErrMsg: ValidateErrorMassage, toUriObj): void => {
  validateErrMsg.header=TO
  validateErrMsg.part=USER
  expect(toUriObj.user).toEqual(session.AppSid);
};

export const contactHeaderValidate = (session: Session, validateErrMsg: ValidateErrorMassage, uriUriObj): void => {

  validateErrMsg.header=CONTACT
  //expect(uriUriObj.user).toEqual(session.srcUser);
  validateErrMsg.part=PORT
  expect(uriUriObj.port).toEqual(WebTRCGW_PORT);
  validateErrMsg.part=HOST
  expect(uriUriObj.host).toEqual(LOCAL_HOST);

};

export const uriHeaderValidate = (session: Session, validateErrMsg: ValidateErrorMassage, mainUriObj): void => {

  validateErrMsg.header=URI
  validateErrMsg.part=PORT
  expect(mainUriObj.port).toEqual(RESTCOM_PORT);
  validateErrMsg.part=HOST
  expect(mainUriObj.host).toEqual(LOCAL_HOST);
  validateErrMsg.part=USER
  expect(mainUriObj.user).toEqual(session.destUser);

};















