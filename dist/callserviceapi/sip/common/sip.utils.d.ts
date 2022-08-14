export declare const PREFIX_SIP: string;
export declare const PREFIX_TEL: string;
export declare class SipUtils {
    private isContainPrefix;
    getDomain(contact: string): string;
    getURI(uri: string, overrideUserStr?: string): string;
    parseUri(uri: string): SipURI;
    uriToString(uri: SipURI): string;
    getUserPart(uri: string): string;
}
export interface SipURI {
    schema: 'sip' | 'tel';
    port: number;
    host: string;
    user: string;
}
