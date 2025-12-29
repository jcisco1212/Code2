import { Model, DataTypes, Optional } from 'sequelize';
import bcrypt from 'bcryptjs';
import { sequelize } from '../config/database';

export enum UserRole {
  USER = 'user',
  CREATOR = 'creator',
  AGENT = 'agent',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin'
}

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
  PREFER_NOT_TO_SAY = 'prefer_not_to_say'
}

export enum ArtistType {
  SOLO = 'solo',
  BAND = 'band'
}

export interface SocialLinks {
  website?: string;
  imdb?: string;
  instagram?: string;
  twitter?: string;
  tiktok?: string;
  youtube?: string;
  linkedin?: string;
  spotify?: string;
  soundcloud?: string;
  agency?: string;
}

export interface PrivacySettings {
  showAge: boolean;
  showDateOfBirth: boolean;
  showEthnicity: boolean;
  showLocation: boolean;
  showGender: boolean;
}

export interface NotificationSettings {
  emailNewFollower: boolean;
  emailComments: boolean;
  emailLikes: boolean;
  emailMessages: boolean;
  pushNewFollower: boolean;
  pushComments: boolean;
  pushLikes: boolean;
  pushMessages: boolean;
}

interface UserAttributes {
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
}

interface UserCreationAttributes extends Optional<UserAttributes,
  'id' | 'displayName' | 'firstName' | 'lastName' | 'bio' | 'avatarUrl' | 'bannerUrl' |
  'location' | 'socialLinks' | 'agencyName' | 'role' | 'isVerified' | 'isActive' | 'twoFactorEnabled' |
  'twoFactorSecret' | 'emailVerified' | 'emailVerificationToken' | 'passwordResetToken' |
  'passwordResetExpires' | 'lastLogin' | 'gender' | 'dateOfBirth' | 'ethnicity' | 'photoGallery' |
  'artistType' | 'genre' | 'talentCategories' | 'privacySettings' | 'notificationSettings' | 'createdAt' | 'updatedAt'
> {}

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  declare id: string;
  declare email: string;
  declare passwordHash: string;
  declare username: string;
  declare displayName: string | null;
  declare firstName: string | null;
  declare lastName: string | null;
  declare bio: string | null;
  declare avatarUrl: string | null;
  declare bannerUrl: string | null;
  declare location: string | null;
  declare socialLinks: SocialLinks | null;
  declare agencyName: string | null;
  declare role: UserRole;
  declare isVerified: boolean;
  declare isActive: boolean;
  declare twoFactorEnabled: boolean;
  declare twoFactorSecret: string | null;
  declare emailVerified: boolean;
  declare emailVerificationToken: string | null;
  declare passwordResetToken: string | null;
  declare passwordResetExpires: Date | null;
  declare lastLogin: Date | null;
  // New fields
  declare gender: Gender | null;
  declare dateOfBirth: Date | null;
  declare ethnicity: string | null;
  declare photoGallery: string[] | null;
  declare artistType: ArtistType | null;
  declare genre: string | null;
  declare talentCategories: string[] | null;
  declare privacySettings: PrivacySettings | null;
  declare notificationSettings: NotificationSettings | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // Computed property for age
  get age(): number | null {
    if (!this.dateOfBirth) return null;
    const today = new Date();
    const birth = new Date(this.dateOfBirth);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  }

  // Instance methods
  public async comparePassword(candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.passwordHash);
  }

  public toPublicJSON(): Partial<UserAttributes> & { age?: number | null; dateOfBirth?: Date | null } {
    const privacy = this.privacySettings || {
      profilePublic: true,
      showEmail: false,
      allowMessages: true,
      showActivity: true,
      showAge: true,
      showDateOfBirth: false,
      showEthnicity: true,
      showLocation: true,
      showGender: true
    };

    return {
      id: this.id,
      username: this.username,
      displayName: this.displayName,
      firstName: this.firstName,
      lastName: this.lastName,
      role: this.role,
      avatarUrl: this.avatarUrl,
      bannerUrl: this.bannerUrl,
      bio: this.bio,
      location: privacy.showLocation ? this.location : null,
      socialLinks: this.socialLinks,
      isVerified: this.isVerified,
      gender: privacy.showGender ? this.gender : null,
      age: privacy.showAge ? this.age : null,
      dateOfBirth: privacy.showDateOfBirth ? this.dateOfBirth : null,
      ethnicity: privacy.showEthnicity ? this.ethnicity : null,
      email: privacy.showEmail ? this.email : null,
      photoGallery: this.photoGallery,
      artistType: this.artistType,
      genre: this.genre,
      talentCategories: this.talentCategories,
      createdAt: this.createdAt
    };
  }

  public toAuthJSON(): Partial<UserAttributes> & { age?: number | null } {
    return {
      id: this.id,
      email: this.email,
      username: this.username,
      displayName: this.displayName,
      firstName: this.firstName,
      lastName: this.lastName,
      role: this.role,
      isActive: this.isActive,
      emailVerified: this.emailVerified,
      twoFactorEnabled: this.twoFactorEnabled,
      avatarUrl: this.avatarUrl,
      bannerUrl: this.bannerUrl,
      bio: this.bio,
      location: this.location,
      socialLinks: this.socialLinks,
      isVerified: this.isVerified,
      gender: this.gender,
      age: this.age,
      dateOfBirth: this.dateOfBirth,
      ethnicity: this.ethnicity,
      photoGallery: this.photoGallery,
      artistType: this.artistType,
      genre: this.genre,
      talentCategories: this.talentCategories,
      privacySettings: this.privacySettings,
      notificationSettings: this.notificationSettings,
      createdAt: this.createdAt
    };
  }
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    passwordHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'password_hash'
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        len: [3, 50]
      }
    },
    displayName: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'display_name'
    },
    firstName: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'first_name'
    },
    lastName: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'last_name'
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    avatarUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'avatar_url'
    },
    bannerUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'banner_url'
    },
    location: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    socialLinks: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: null,
      field: 'social_links'
    },
    agencyName: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'agency_name'
    },
    role: {
      type: DataTypes.ENUM('user', 'creator', 'agent', 'admin', 'super_admin'),
      defaultValue: 'user'
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_verified'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
    },
    twoFactorEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'two_factor_enabled'
    },
    twoFactorSecret: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'two_factor_secret'
    },
    emailVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'email_verified'
    },
    emailVerificationToken: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'email_verification_token'
    },
    passwordResetToken: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'password_reset_token'
    },
    passwordResetExpires: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'password_reset_expires'
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_login'
    },
    // New demographic and profile fields
    gender: {
      type: DataTypes.ENUM('male', 'female', 'other', 'prefer_not_to_say'),
      allowNull: true
    },
    dateOfBirth: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'date_of_birth'
    },
    ethnicity: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    photoGallery: {
      type: DataTypes.ARRAY(DataTypes.STRING(500)),
      allowNull: true,
      defaultValue: [],
      field: 'photo_gallery'
    },
    // Music-specific fields
    artistType: {
      type: DataTypes.ENUM('solo', 'band'),
      allowNull: true,
      field: 'artist_type'
    },
    genre: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    talentCategories: {
      type: DataTypes.ARRAY(DataTypes.UUID),
      allowNull: true,
      defaultValue: [],
      field: 'talent_categories'
    },
    privacySettings: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {
        showAge: true,
        showDateOfBirth: false,
        showEthnicity: true,
        showLocation: true,
        showGender: true
      },
      field: 'privacy_settings'
    },
    notificationSettings: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {
        emailNewFollower: true,
        emailComments: true,
        emailLikes: false,
        emailMessages: true,
        pushNewFollower: true,
        pushComments: true,
        pushLikes: true,
        pushMessages: true
      },
      field: 'notification_settings'
    },
    createdAt: {
      type: DataTypes.DATE,
      field: 'created_at'
    },
    updatedAt: {
      type: DataTypes.DATE,
      field: 'updated_at'
    }
  },
  {
    sequelize,
    tableName: 'users',
    modelName: 'User',
    indexes: [
      { fields: ['email'], unique: true },
      { fields: ['username'], unique: true },
      { fields: ['role'] },
      { fields: ['gender'] },
      { fields: ['ethnicity'] },
      { fields: ['location'] },
      { fields: ['artist_type'] },
      { fields: ['genre'] }
    ],
    hooks: {
      beforeCreate: async (user: User) => {
        if (user.passwordHash && !user.passwordHash.startsWith('$2')) {
          const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS || '12'));
          user.passwordHash = await bcrypt.hash(user.passwordHash, salt);
        }
      },
      beforeUpdate: async (user: User) => {
        if (user.changed('passwordHash') && !user.passwordHash.startsWith('$2')) {
          const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS || '12'));
          user.passwordHash = await bcrypt.hash(user.passwordHash, salt);
        }
      }
    }
  }
);

export default User;
