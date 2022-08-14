import { RestcommSimulator} from "../../automation/common/restcomm/e2e/restcomm.simulator";
import {LOCAL_HOST, METHOD_ACK, METHOD_BYE, METHOD_INVITE, OK_RESPONSE, RESTCOM_PORT,WebTRCGW_PORT,SDP} from "../../automation/common/constants";
import {RequestDTO} from "../../automation/common/restcomm/dto/sipMessageDTO";
import {Context,LoadContext} from "../../automation/common/context";


export class LoadRestcommSimulator extends RestcommSimulator {
	constructor(port: number=Number(WebTRCGW_PORT) ) {
		super(port);
	}

	private loadContext:LoadContext=new LoadContext()

	public setLoadContext(ctx:LoadContext){
	    this.loadContext = ctx;
	}

	protected onSipMsgReq(request: RequestDTO): void {
		let user=this.utils.parseUri(request.headers.from.uri)
		let sessionID=Number(user.user.split("_")[2])

		let context:Context=this.loadContext.MultiContext[sessionID]
		this.setsOnSipMsgReq(request,context)
	}

}
