import UserModel from '../models/User';
import { SocialLinks, EmbedLinks, UserRole, Gender, ArtistType, PrivacySettings, NotificationSettings } from '../models/User';

declare global {
  namespace Express {
    // Override Express.User to use our User model properties
    interface User {
      id: string;
      email: string;
      passwordHash: string;
      username: string;
      displayName: string | null;
      firstName: string | null;
      lastName: string | null;
      bio: string | null;
      avatarUrl: string | null;
      bannerUrl: string | null;
      location: string | null;
      socialLinks: SocialLinks | null;
      embedLinks: EmbedLinks | null;
      agencyName: string | null;
      role: UserRole;
      isVerified: boolean;
      isActive: boolean;
      twoFactorEnabled: boolean;
      twoFactorSecret: string | null;
      emailVerified: boolean;
      emailVerificationToken: string | null;
      passwordResetToken: string | null;
      passwordResetExpires: Date | null;
      lastLogin: Date | null;
      // New fields
      gender: Gender | null;
      dateOfBirth: Date | null;
      ethnicity: string | null;
      photoGallery: string[] | null;
      artistType: ArtistType | null;
      genre: string | null;
      talentCategories: string[] | null;
      privacySettings: PrivacySettings | null;
      notificationSettings: NotificationSettings | null;
      createdAt: Date;
      updatedAt: Date;
      comparePassword(candidatePassword: string): Promise<boolean>;
      toPublicJSON(): Partial<any>;
      toAuthJSON(): Partial<any>;
      update(values: Partial<any>): Promise<any>;
      save(): Promise<any>;
      verification?: any;
    }
    interface Request {
      user?: User;
      userId?: string;
    }
  }
}

export {};
