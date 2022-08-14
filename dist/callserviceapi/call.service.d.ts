import { ApiGwFormatDto } from '../dto/apiGwFormatDto';
import { RequestDTO } from './sip/common/sipMessageDTO';
export interface CallService {
    makeCall(request: ApiGwFormatDto): any;
    updateCall(request: ApiGwFormatDto): any;
    endCall(request: ApiGwFormatDto): any;
    createRoom(request: ApiGwFormatDto): any;
    closeRoom(request: ApiGwFormatDto): any;
    addUser(request: RequestDTO): any;
    updateUser(request: RequestDTO): any;
    disconnectUser(request: RequestDTO): any;
    cleanRoom(request: RequestDTO): any;
    ringingResponse(request: ApiGwFormatDto): any;
    connectResponse(request: ApiGwFormatDto): any;
    updateResponse(request: ApiGwFormatDto): any;
    updateRejectResponse(request: ApiGwFormatDto): any;
    rejectResponse(request: ApiGwFormatDto): any;
    endCallResponse(request: ApiGwFormatDto): any;
}
