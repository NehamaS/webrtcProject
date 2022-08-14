import {Controller, Post} from "@nestjs/common";


@Controller()
export class HttpSimulator {

    @Post()
    public async doSomthing(){
        console.log("aws mock incomming traffick...");
    }

}
