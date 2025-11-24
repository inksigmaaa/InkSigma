const { pgTable, text, timestamp, boolean, serial, integer } = require("drizzle-orm/pg-core");

const publication = pgTable("publication", {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    subdomain: text("subdomain").notNull().unique(),
    description: text("description"),
    image: text("image"),
    logoUrl: text("logoUrl"),
    faviconUrl: text("faviconUrl"),
    metaOgImageUrl: text("metaOgImageUrl"),
    userId: text("userId").notNull(),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

module.exports = { publication };
