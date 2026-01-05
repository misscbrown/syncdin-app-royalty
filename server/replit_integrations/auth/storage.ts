import { users, type User, type UpsertUser } from "@shared/models/auth";
import { tracks, uploadedFiles, prsStatements, works } from "@shared/schema";
import { db } from "../../db";
import { eq, and, ne } from "drizzle-orm";

// Onboarding data structure
export interface OnboardingData {
  fullName: string;
  role: string;
  country?: string;
  acceptedTerms: boolean;
  acceptedPrivacy: boolean;
}

// Interface for auth storage operations
// (IMPORTANT) These user operations are mandatory for Replit Auth.
export interface IAuthStorage {
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateOnboarding(userId: string, data: OnboardingData): Promise<User>;
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
        
        // Migrate all data from old user to new user in a single transaction
        // Order: 1) Insert new user, 2) Migrate related records, 3) Delete old user
        const [migratedUser] = await db.transaction(async (tx) => {
          // First, insert the new user (so FK constraints are satisfied)
          const [newUser] = await tx
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
          
          // Now migrate all related records to the new user ID
          await tx.update(tracks)
            .set({ userId: userData.id })
            .where(eq(tracks.userId, existingUserByEmail.id));
          
          await tx.update(uploadedFiles)
            .set({ userId: userData.id })
            .where(eq(uploadedFiles.userId, existingUserByEmail.id));
          
          await tx.update(prsStatements)
            .set({ userId: userData.id })
            .where(eq(prsStatements.userId, existingUserByEmail.id));
          
          await tx.update(works)
            .set({ userId: userData.id })
            .where(eq(works.userId, existingUserByEmail.id));
          
          // Finally, delete the old user record
          await tx.delete(users).where(eq(users.id, existingUserByEmail.id));
          
          return [newUser];
        });
        
        console.log(`User data migration complete for ${userData.email}`);
        return migratedUser;
      }
    }

    // Standard upsert when no migration is needed
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

  async updateOnboarding(userId: string, data: OnboardingData): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        fullName: data.fullName,
        role: data.role,
        country: data.country || null,
        acceptedTerms: data.acceptedTerms,
        acceptedPrivacy: data.acceptedPrivacy,
        onboardingCompleted: true,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }
}

export const authStorage = new AuthStorage();
