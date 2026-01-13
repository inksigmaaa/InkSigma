import { db } from "./config/database.js";
import { publication } from "./models/schema.js";

async function checkLogos() {
    try {
        const publications = await db.select().from(publication);
        
        console.log("\n=== PUBLICATION LOGOS ===\n");
        publications.forEach(pub => {
            console.log(`ID: ${pub.id}`);
            console.log(`Name: ${pub.name}`);
            console.log(`LogoUrl: ${pub.logoUrl || 'NO LOGO'}`);
            console.log(`FaviconUrl: ${pub.faviconUrl || 'NO FAVICON'}`);
            console.log('---');
        });
        
        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}

checkLogos();
