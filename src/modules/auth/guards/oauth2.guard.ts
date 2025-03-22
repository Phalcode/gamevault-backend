import { Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class Oauth2Guard extends AuthGuard("oauth2") {}
