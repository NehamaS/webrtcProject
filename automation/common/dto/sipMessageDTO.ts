export interface CSeq {
    method: string;
    seq: number;
}

export interface ContactDTO {
    uri: string;
    params?: ToTag;
}

export interface ToTag {
    tag:string
}

export interface SipDTO {
    version: string;
    headers: {
        to: ContactDTO;
        from: ContactDTO;
        "call-id": string;
        cseq: CSeq;
        contact?: Array<ContactDTO>;
        via?: any;
        "X-RestComm-OrganizationSid"?: string;
        "X-RestComm-AccountSid"?: string;
        "X-RestComm-ApplicationSid"?:string;
        "Content-Type"?: string;
    };
    content?: string;
}

export interface RequestDTO extends SipDTO {
    method: string;
    uri: string;
}

export interface ValidateErrorMassage{
   method:string,
   header:string,
   part:string
}

export interface ResponseDTO extends SipDTO {
    status: number;
    reason: string;
}

export class Uri{
    port: string = <string>""
    domain: string = <string>""
    user: string = <string>""

    public uri = (): string => {
        const baseUri = `${this.user}@${this.domain}:${this.port}`;
        return  `sip:${baseUri}`;
    };

}