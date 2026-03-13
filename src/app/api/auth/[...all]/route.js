import { getAuth } from "@/app/lib/auth";

export const GET = (...args) => getAuth().handler(...args);
export const POST = (...args) => getAuth().handler(...args);
