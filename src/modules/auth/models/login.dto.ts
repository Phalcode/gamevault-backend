import { GamevaultJwt } from "./gamevault-jwt.interface";

export default interface LoginDto {
  id: string;
  access_token: string;
  refresh_token?: string;
  payload?: GamevaultJwt;
}
