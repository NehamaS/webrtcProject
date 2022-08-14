import {Injectable} from "@nestjs/common";
import {ConfigurationService} from "service-infrastructure/common/config/configuration.service";
import {MculoggerService} from "service-infrastructure/common/logs/mculogger.service";
import XMLWriter = require("xml-writer");

let xml = "<?xml version=\"1.0\" encoding=\"US-ASCII\"?>\r\n";

@Injectable()
export class MsmlFactory {

    constructor(private readonly config: ConfigurationService,
                private readonly logger: MculoggerService) {
    }

    public createConference(roomId: string): string {
        this.logger.debug({ msg: "createConference function"});

        let xw = new XMLWriter;
        xw.startElement('msml');
        xw.writeAttribute('version', '1.1');
        xw.startElement('createconference');
        xw.writeAttribute('name', roomId);
        xw.writeAttribute('deletewhen', "nocontrol");
        xw.writeAttribute('mark', "1");
        xw.writeAttribute('term', "true");
        xw.endElement();

        return xml + xw.toString();
    }

    public join(roomId: string, userId): string {
        this.logger.debug({ msg: "join function"});

        let xw = new XMLWriter;
        xw.startElement('msml');
        xw.writeAttribute('version', '1.1');
        xw.startElement('join');
        xw.writeAttribute('id1', "conf:" + roomId);
        xw.writeAttribute('id2', "conn:" + userId);
        xw.writeAttribute('mark', "2");
        xw.startElement('stream');
        xw.writeAttribute('media', "audio");
        xw.endElement();

        return xml + xw.toString();
    }

    public unjoin(roomId: string, userId): string {
        this.logger.debug({ msg: "join function"});

        let xw = new XMLWriter;
        xw.startElement('msml');
        xw.writeAttribute('version', '1.1');
        xw.startElement('unjoin');
        xw.writeAttribute('id1', "conn:" + userId);
        xw.writeAttribute('id2', "conf:" + roomId);
        xw.endElement();

        return xml + xw.toString();
    }
}

