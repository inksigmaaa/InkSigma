import { db } from "./config/database.js";
import { sql } from "drizzle-orm";

async function checkTimezone() {
    try {
        // Check database timezone
        const result = await db.execute(sql`SHOW TIMEZONE`);
        console.log("Database timezone:", result);
        
        // Check current timestamp
        const now = await db.execute(sql`SELECT NOW(), CURRENT_TIMESTAMP`);
        console.log("Database current time:", now);
        
        // Check JavaScript time
        console.log("JavaScript current time:", new Date().toISOString());
        console.log("JavaScript local time:", new Date().toString());
        
        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}

checkTimezone();
