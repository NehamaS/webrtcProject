import * as sip from "sip";

export const PREFIX_SIP: string = "sip:";
export const PREFIX_TEL: string = "tel:";

export class SipUtils {

    private isContainPrefix(contact: string): boolean {
        return contact.startsWith(PREFIX_SIP) || contact.startsWith(PREFIX_TEL);
    }

    /**
     * Retrun the contact domain name or tell number
     */
    public getContactDomain(contact: string) {
        let contactDomainName: string = contact.startsWith(PREFIX_SIP) ? contact.substr(4) : contact;

        return contactDomainName;
    }

    /**
     * Add sip uri to uri if missing, not aded to a tel number.
     * Default if prefix is missing is sip
     */
    public getURI(uri: string, overrideUserStr? : string) : string {
        let result : string = this.isContainPrefix(uri) ? uri : `${PREFIX_SIP}${uri}`;
        if (overrideUserStr){
            let uri = this.parseUri(result);
            uri.user = overrideUserStr;
            result = sip.stringifyUri(uri);
        }

        return result;
    }

    public parseUri(uri: string): SipURI{
        return sip.parseUri(uri);
    }
}

export interface SipURI {
    schema: 'sip' | 'tel';
    port: number;
    host: string;
    user: string;
}
