
export class WebRtcError extends Error{
    constructor(public ctx?: any, message?:string) {
        super(message);
    }
}
