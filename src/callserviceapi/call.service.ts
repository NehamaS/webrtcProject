import {Injectable, OnModuleInit} from '@nestjs/common';
import {ApiGwFormatDto} from '../dto/apiGwFormatDto';
import {RequestDTO} from './sip/common/sipMessageDTO';

export interface CallService {

        //Incoming Requests
    makeCall(request: ApiGwFormatDto);
    updateCall(request: ApiGwFormatDto);
    endCall(request: ApiGwFormatDto);
    createRoom(request: ApiGwFormatDto);
    closeRoom(request: ApiGwFormatDto);


       //Outgoing Requests
    addUser(request: RequestDTO);
    updateUser(request: RequestDTO);
    disconnectUser(request: RequestDTO);
    cleanRoom(request: RequestDTO);

        //Incoming Responses
    ringingResponse(request: ApiGwFormatDto);
    connectResponse(request: ApiGwFormatDto);
    updateResponse(request: ApiGwFormatDto);
    updateRejectResponse(request: ApiGwFormatDto);
    rejectResponse(request: ApiGwFormatDto);
    endCallResponse(request: ApiGwFormatDto);
}

