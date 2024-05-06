import { Injectable, NestMiddleware } from "@nestjs/common";
import { NextFunction, Request, Response } from "express";

@Injectable()
export class ApiVersionMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Replace /api/v1/ with /api/ in the request URL
    req.url = req.url.replace("/api/v1/", "/api/");

    next();
  }
}
