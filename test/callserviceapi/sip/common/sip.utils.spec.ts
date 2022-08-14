import {MessageFactory} from "../../../../src/callserviceapi/sip/massagefactory/message.factory";
import {SipUtils} from "../../../../src/callserviceapi/sip/common/sip.utils";

describe('MessageFactory', () => {
    let utils: SipUtils;

    beforeEach(() => {
        utils = new SipUtils();
    })

    it('getUri', async () => {

        let uri: string = utils.getURI("sip:user1@mavenir.com");
        expect(uri).toEqual("sip:user1@mavenir.com");

        uri = utils.getURI("user1@mavenir.com");
        expect(uri).toEqual("sip:user1@mavenir.com");

        uri = utils.getURI("tel:user1");
        expect(uri).toEqual("tel:user1");

    });

});
