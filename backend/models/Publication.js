const { db } = require('../config/db');
const { eq, and, ne } = require('drizzle-orm');
const { publication } = require('../db/schema.cjs');

class Publication {
  // Get publication settings
  static async findById(id) {
    const result = await db.select().from(publication).where(eq(publication.id, id));
    return result[0];
  }

  // Get publication by user ID
  static async findByUserId(userId) {
    const result = await db.select().from(publication).where(eq(publication.userId, userId));
    return result[0];
  }

  // Update basic info (name, description)
  static async updateBasicInfo(id, data) {
    const { name, description } = data;
    const updateData = {
      updatedAt: new Date()
    };
    
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    
    const result = await db.update(publication)
      .set(updateData)
      .where(eq(publication.id, id))
      .returning();
    
    return result[0];
  }

  // Check subdomain availability
  static async isSubdomainAvailable(subdomain, excludeId = null) {
    let query = db.select().from(publication).where(eq(publication.subdomain, subdomain));
    
    if (excludeId) {
      query = db.select().from(publication)
        .where(and(
          eq(publication.subdomain, subdomain),
          ne(publication.id, excludeId)
        ));
    }
    
    const result = await query;
    return result.length === 0;
  }

  // Update subdomain
  static async updateSubdomain(id, subdomain) {
    const result = await db.update(publication)
      .set({ 
        subdomain,
        updatedAt: new Date()
      })
      .where(eq(publication.id, id))
      .returning();
    
    return result[0];
  }

  // Update image URLs
  static async updateImageUrl(id, imageType, url) {
    const columnMap = {
      logo: 'logoUrl',
      favicon: 'faviconUrl',
      meta_og: 'metaOgImageUrl'
    };
    
    const column = columnMap[imageType];
    if (!column) throw new Error('Invalid image type');
    
    const updateData = {
      [column]: url,
      updatedAt: new Date()
    };
    
    const result = await db.update(publication)
      .set(updateData)
      .where(eq(publication.id, id))
      .returning();
    
    return result[0];
  }

  // Remove image
  static async removeImage(id, imageType) {
    const columnMap = {
      logo: 'logoUrl',
      favicon: 'faviconUrl',
      meta_og: 'metaOgImageUrl'
    };
    
    const column = columnMap[imageType];
    if (!column) throw new Error('Invalid image type');
    
    const updateData = {
      [column]: null,
      updatedAt: new Date()
    };
    
    const result = await db.update(publication)
      .set(updateData)
      .where(eq(publication.id, id))
      .returning();
    
    return result[0];
  }
}

module.exports = Publication;
