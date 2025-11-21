import { auth } from "@/app/lib/auth";
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, username, bio } = body;

    console.log('Updating profile with:', { name, username, bio });

    // Build update object
    const updateData = {
      name: name || session.user.name,
      username: username || null,
      bio: bio || null,
      updatedAt: new Date(),
    };

    console.log('Update data:', updateData);

    // Update user in database
    const result = await db
      .update(user)
      .set(updateData)
      .where(eq(user.id, session.user.id))
      .returning();

    console.log('Update result:', result);

    return Response.json({ 
      success: true,
      message: "Profile updated successfully" 
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return Response.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
