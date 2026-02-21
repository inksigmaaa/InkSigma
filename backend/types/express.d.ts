import { Request } from "express";

declare global {
  namespace Express {
    interface Request {
      user?: any;
      tenant?: any;
      publication?: any;
      userRole?: any;
    }
  }
}
