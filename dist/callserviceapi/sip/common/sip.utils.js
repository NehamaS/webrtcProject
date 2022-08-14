"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SipUtils = exports.PREFIX_TEL = exports.PREFIX_SIP = void 0;
const common_1 = require("@nestjs/common");
const sip = __importStar(require("sip"));
exports.PREFIX_SIP = "sip:";
exports.PREFIX_TEL = "tel:";
let SipUtils = class SipUtils {
    isContainPrefix(contact) {
        return contact.startsWith(exports.PREFIX_SIP) || contact.startsWith(exports.PREFIX_TEL);
    }
    getDomain(contact) {
        let contactDomainName = this.isContainPrefix(contact) ? contact.substr(4) : contact;
        return contactDomainName;
    }
    getURI(uri, overrideUserStr) {
        let result = this.isContainPrefix(uri) ? uri : `${exports.PREFIX_SIP}${uri}`;
        if (overrideUserStr) {
            let url = this.parseUri(result);
            url.user = overrideUserStr;
            result = this.uriToString(url);
        }
        return result;
    }
    parseUri(uri) {
        return sip.parseUri(uri);
    }
    uriToString(uri) {
        return sip.stringifyUri(uri);
    }
    getUserPart(uri) {
        let user = uri;
        if (uri.indexOf('@') !== -1) {
            user = uri.split('@')[0];
        }
        return (user.includes(exports.PREFIX_SIP) || user.includes(exports.PREFIX_TEL)) ? user.split(":")[1] : user;
    }
};
SipUtils = __decorate([
    (0, common_1.Injectable)()
], SipUtils);
exports.SipUtils = SipUtils;
//# sourceMappingURL=sip.utils.js.map