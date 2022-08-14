import { Uri } from './sipMessageDTO';
export interface SipSession {
    callId: string;
    to: Uri;
    from: Uri;
    meetingId?: string;
    service?: "P2P" | "P2A" | "A2P" | "P2M";
    contact?: Array<Uri>;
    destContact: any;
    seqNumber: number;
    callSid?: string;
    roomId?: string;
    roomType?: "av" | "ss";
    userId?: string;
}
