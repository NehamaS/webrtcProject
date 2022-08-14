export interface CSeq {
    method: string;
    seq: number;
}
export interface Uri {
    uri: string;
    params?: any;
}
export interface SipDTO {
    version: string;
    headers: {
        to: Uri;
        from: Uri;
        "call-id": string;
        cseq: CSeq;
        contact?: Array<Uri>;
        via?: any;
        "x-meetingid"?: string;
        "x-service-type"?: "P2P" | "P2A" | "A2P" | "P2M";
        authorization?: string;
        "content-type"?: string;
        "x-restcomm-callsid"?: string;
        "max-forwards"?: number;
        "user-agent"?: string;
        "x-called-party-id"?: string;
        "x-call-control"?: boolean;
        "x-dialogue-type"?: number;
    };
    content?: string;
}
export interface RequestDTO extends SipDTO {
    method: string;
    uri: string;
}
export interface ResponseDTO extends SipDTO {
    status: number;
    reason: string;
}
export interface Status {
    status: number;
    reason: string;
}
