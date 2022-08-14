"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MsmlFactory = void 0;
const common_1 = require("@nestjs/common");
const configuration_service_1 = require("service-infrastructure/common/config/configuration.service");
const mculogger_service_1 = require("service-infrastructure/common/logs/mculogger.service");
const XMLWriter = require("xml-writer");
let xml = "<?xml version=\"1.0\" encoding=\"US-ASCII\"?>\r\n";
let MsmlFactory = class MsmlFactory {
    constructor(config, logger) {
        this.config = config;
        this.logger = logger;
    }
    createConference(roomId) {
        this.logger.debug({ msg: "createConference function" });
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
    join(roomId, userId) {
        this.logger.debug({ msg: "join function" });
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
    unjoin(roomId, userId) {
        this.logger.debug({ msg: "join function" });
        let xw = new XMLWriter;
        xw.startElement('msml');
        xw.writeAttribute('version', '1.1');
        xw.startElement('unjoin');
        xw.writeAttribute('id1', "conn:" + userId);
        xw.writeAttribute('id2', "conf:" + roomId);
        xw.endElement();
        return xml + xw.toString();
    }
};
MsmlFactory = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [configuration_service_1.ConfigurationService,
        mculogger_service_1.MculoggerService])
], MsmlFactory);
exports.MsmlFactory = MsmlFactory;
//# sourceMappingURL=msml.factory.js.map