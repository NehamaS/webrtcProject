import { UserDataDto } from "../../dto/user.data.dto";
export interface DataMessage {
    [key: string]: string;
    action: string;
    userId: string;
}
export interface httpRequestDto {
    callerUserId: string;
    userData: UserDataDto;
}
