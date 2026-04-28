declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      user?: any;
      tenant?: any;
      publication?: any;
      publicationAccess?: any;
      notificationId?: number;
      userRole?: any;
    }
  }
}

export {};
