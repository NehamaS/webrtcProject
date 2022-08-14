import {Injectable} from "@nestjs/common";
import * as sip from "sip";

export const PREFIX_SIP: string = "sip:";
export const PREFIX_TEL: string = "tel:";

@Injectable()
export class SipUtils {

    private isContainPrefix(contact: string): boolean {
        return contact.startsWith(PREFIX_SIP) || contact.startsWith(PREFIX_TEL);
    }

    /**
     * Retrun the  domain name or tell number
     */
    public getDomain(contact: string) {
        let contactDomainName: string = this.isContainPrefix(contact) ? contact.substr(4) : contact;

        return contactDomainName;
    }

    /**
     * Add sip uri to uri if missing, not aded to a tel number.
     * Default if prefix is missing is sip
     */
    public getURI(uri: string, overrideUserStr? : string) : string {
        let result : string = this.isContainPrefix(uri) ? uri : `${PREFIX_SIP}${uri}`;
        if (overrideUserStr){
            let url = this.parseUri(result);
            url.user = overrideUserStr;
            result = this.uriToString(url);
        }

        return result;
    }

    public parseUri(uri: string): SipURI{
        return sip.parseUri(uri);
    }

    public uriToString(uri: SipURI): string{
        return sip.stringifyUri(uri);
    }

    public getUserPart(uri: string): string {
        let user: string = uri;
        if (uri.indexOf('@') !== -1) {
            user = uri.split('@')[0];
        }

        return (user.includes(PREFIX_SIP) || user.includes(PREFIX_TEL)) ? user.split(":")[1] : user;
    }

}

export interface SipURI {
    schema: 'sip' | 'tel';
    port: number;
    host: string;
    user: string;
}
