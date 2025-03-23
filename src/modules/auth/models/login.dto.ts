import { GamevaultJwt } from "./gamevault-jwt.interface";

export class LoginDto {
  id: string;
  access_token: string;
  refresh_token?: string;
  payload?: GamevaultJwt;
}
