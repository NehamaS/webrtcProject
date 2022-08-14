import { ApiGwDto } from "./api.gw.dto";

export class WsRequestDto {
  connectionId: string;
  dto?: ApiGwDto;
}
