import { Injectable, NestMiddleware } from "@nestjs/common";
import { type NextFunction, type Request, type Response } from "express";

@Injectable()
export class LegacyRoutesMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Replace /api/v1/ with /api/ in the request URL
    req.url = req.url.replace("/api/v1/", "/api/");

    // Redirect /api/files/reindex to newer /api/games/reindex"
    req.url = req.url.replace("/api/files/reindex", "/api/games/reindex");

    next();
  }
}
