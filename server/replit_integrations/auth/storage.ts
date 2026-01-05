import { users, type User, type UpsertUser } from "@shared/models/auth";
import { tracks, uploadedFiles, prsStatements, works } from "@shared/schema";
import { db } from "../../db";
import { eq, and, ne } from "drizzle-orm";

// Interface for auth storage operations
// (IMPORTANT) These user operations are mandatory for Replit Auth.
export interface IAuthStorage {
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
}

class AuthStorage implements IAuthStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    // Check if there's an existing user with the same email but different ID
    // This handles migration from custom auth to Replit Auth
    if (userData.email && userData.id) {
      const [existingUserByEmail] = await db
        .select()
        .from(users)
        .where(and(
          eq(users.email, userData.email),
          ne(users.id, userData.id)
        ));

      if (existingUserByEmail) {
        console.log(`Migrating user data from ${existingUserByEmail.id} to ${userData.id}`);
        
        // Migrate all data from old user to new user
        await db.transaction(async (tx) => {
          // Update tracks
          await tx.update(tracks)
            .set({ userId: userData.id })
            .where(eq(tracks.userId, existingUserByEmail.id));
          
          // Update uploaded files
          await tx.update(uploadedFiles)
            .set({ userId: userData.id })
            .where(eq(uploadedFiles.userId, existingUserByEmail.id));
          
          // Update PRS statements
          await tx.update(prsStatements)
            .set({ userId: userData.id })
            .where(eq(prsStatements.userId, existingUserByEmail.id));
          
          // Update works
          await tx.update(works)
            .set({ userId: userData.id })
            .where(eq(works.userId, existingUserByEmail.id));
          
          // Delete the old user record
          await tx.delete(users).where(eq(users.id, existingUserByEmail.id));
        });
        
        console.log(`User data migration complete for ${userData.email}`);
      }
    }

    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }
}

export const authStorage = new AuthStorage();
