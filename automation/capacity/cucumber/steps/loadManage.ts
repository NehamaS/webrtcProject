import {basicRegister,basicCallStart,basicCallEnd}from "../../../common/steps/cpaas-steps";
import {wait} from "../../../common/utils";
import {Context,LoadContext} from "../../../common/context";
import {LoadRestcommSimulator} from "../common/load.restcomm.simulator";
import {LOCAL_HOST} from "../../../common/constants";
import {Session,DeviceTypeList} from "../../../common/dto/sipSessionDTO";
import {rstring,random} from "../../../common/utils"
import {HttpClientServer} from "../../../common/http-client/http-client.server";

let runTest=true

export const thresholdCalculate=(loadContext:LoadContext)=>
{

    if((loadContext.threshold*loadContext.succeedsResult/100)<(loadContext.failuresResult))
    {
        console.log("failures: "+loadContext.failuresResult)
        console.log("succeed: "+loadContext.succeedsResult)
        throw new Error(`high failures rate according to ${loadContext.threshold} threshold `);
    }
    return true

}

export const runSingleSession = async (context: Context, srcUser: string, destUser: string, app: HttpClientServer, loadContext: LoadContext) => {
    await basicRegister(srcUser, destUser, context, app, loadContext)
    await basicCallStart(srcUser, destUser, context, app, loadContext)
    await wait(random(3000, 7000))
    await basicCallEnd(srcUser, "", destUser, context, app, loadContext)
};

export const runSingleSessionInLoop= async (context:Context,srcUser:string,destUser:string,app:HttpClientServer,loadContext:LoadContext) => {
    await wait(Number(srcUser.split("_")[2]) * 1000)
    let index:number=0
    do {
        await  runSingleSession(context,`${srcUser}_${index}`,`${destUser}_${index}`,app,loadContext)
        index++
    }
    while (runTest&&thresholdCalculate(loadContext));
};

export const systemSet=  (given: any, loadContext: LoadContext) => {
        given(/system is runnig on (.*)/, async (address) => {
            let cpaasAddress: string = address || LOCAL_HOST;
            console.log(`System is running on ${cpaasAddress}`);
            loadContext.cpaasAddress=cpaasAddress
        });



}


export const loadSetup=  (given: any, loadContext: LoadContext,sipClient:LoadRestcommSimulator,app:HttpClientServer) => {

    given(/inviteResponse: (.*), inviteTimeOut: (.*), duration: (.*), threshold: (.*) and deviceType:/, async (inviteResponse,inviteTimeOut,duration,threshold,deviceTypeList: Array<DeviceTypeList>) => {
        setTimeout(() => {
          runTest=false
        }, duration*1000);

        sipClient.setLoadContext(loadContext)
        loadContext.numOfSessions=Number(deviceTypeList[0].WEB)+Number(deviceTypeList[0].IPHONE)+Number(deviceTypeList[0].ANDROID)
        loadContext.threshold=threshold

        const RUN_Array: Array<Promise<any>> = new Array<Promise<void>>();
        for (let sessionID = 0; sessionID < Number(loadContext.numOfSessions); sessionID++) {
            const context: Context = new Context();
            context.inviteTimeout=inviteTimeOut
            context.inviteResponse=inviteResponse
            const session: Session = new Session();
            context.deviceType="ANDROID"
            // context.session=session
            loadContext.MultiContext[sessionID] = context;
            const randomPrefix:string=rstring()
            RUN_Array.push(runSingleSessionInLoop(loadContext.MultiContext[sessionID], `srcUser_${randomPrefix}_${sessionID}`, `destUser_${randomPrefix}_${sessionID}`,app,loadContext));
        }
        await Promise.all(RUN_Array);
    })
}
