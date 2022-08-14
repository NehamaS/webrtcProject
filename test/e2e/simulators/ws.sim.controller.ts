import {Body, Controller, HttpCode, HttpStatus, Post} from "@nestjs/common";


@Controller()
export class WsSimController {
    private context : any;


    constructor() {
        console.log("WS mock (http) enabled");
    }

    public setContext(ctx : any){
        this.context = ctx;
    }

    @Post('/ws')
    @HttpCode(HttpStatus.ACCEPTED)
     mockWsMessage(@Body() event: any) {
        console.log("WS mock", {conn: event.connectionId, dto: JSON.parse(event.dto)});

        let arr: Array<String> = this.context.get(event.connectionId) ? this.context.get(event.connectionId) : new Array<String>()
        arr.push(JSON.parse(event.dto))
        this.context.set(event.connectionId, arr);

        return true;
    }

}
