import * as WebSocket from "ws";

//@Injectable()
export class WsClient {
    private ws = new WebSocket('ws://127.0.0.1:5090');

    constructor() {
        this.ws.on("open", () => {
            console.log('open');
        });

        this.ws.on("message", function (message) {
            console.log(message);
        });

    }

    send(data: any) {
        this.ws.send(data);
    }

}
