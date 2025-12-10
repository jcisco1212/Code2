import { Model, DataTypes, Optional } from 'sequelize';
import bcrypt from 'bcryptjs';
import { sequelize } from '../config/database';

export enum UserRole {
  USER = 'user',
  CREATOR = 'creator',
  AGENT = 'agent',
  MODERATOR = 'moderator',
  ADMIN = 'admin'
}

export enum UserStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  BANNED = 'banned'
}

interface UserAttributes {
  id: string;
  email: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  emailVerificationToken: string | null;
  emailVerificationExpires: Date | null;
  passwordResetToken: string | null;
  passwordResetExpires: Date | null;
  twoFactorEnabled: boolean;
  twoFactorSecret: string | null;
  profileImageUrl: string | null;
  bio: string | null;
  location: string | null;
  website: string | null;
  dateOfBirth: Date | null;
  talentCategories: string[];
  agencyName: string | null;
  agencyVerified: boolean;
  lastLoginAt: Date | null;
  loginAttempts: number;
  lockoutUntil: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface UserCreationAttributes extends Optional<UserAttributes,
  'id' | 'role' | 'status' | 'emailVerified' | 'emailVerificationToken' |
  'emailVerificationExpires' | 'passwordResetToken' | 'passwordResetExpires' |
  'twoFactorEnabled' | 'twoFactorSecret' | 'profileImageUrl' | 'bio' |
  'location' | 'website' | 'dateOfBirth' | 'talentCategories' | 'agencyName' |
  'agencyVerified' | 'lastLoginAt' | 'loginAttempts' | 'lockoutUntil' |
  'createdAt' | 'updatedAt'
> {}

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: string;
  public email!: string;
  public username!: string;
  public password!: string;
  public firstName!: string;
  public lastName!: string;
  public role!: UserRole;
  public status!: UserStatus;
  public emailVerified!: boolean;
  public emailVerificationToken!: string | null;
  public emailVerificationExpires!: Date | null;
  public passwordResetToken!: string | null;
  public passwordResetExpires!: Date | null;
  public twoFactorEnabled!: boolean;
  public twoFactorSecret!: string | null;
  public profileImageUrl!: string | null;
  public bio!: string | null;
  public location!: string | null;
  public website!: string | null;
  public dateOfBirth!: Date | null;
  public talentCategories!: string[];
  public agencyName!: string | null;
  public agencyVerified!: boolean;
  public lastLoginAt!: Date | null;
  public loginAttempts!: number;
  public lockoutUntil!: Date | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Instance methods
  public async comparePassword(candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
  }

  public isLocked(): boolean {
    return this.lockoutUntil !== null && this.lockoutUntil > new Date();
  }

  public toPublicJSON(): Partial<UserAttributes> {
    return {
      id: this.id,
      username: this.username,
      firstName: this.firstName,
      lastName: this.lastName,
      role: this.role,
      profileImageUrl: this.profileImageUrl,
      bio: this.bio,
      location: this.location,
      website: this.website,
      talentCategories: this.talentCategories,
      agencyName: this.agencyName,
      agencyVerified: this.agencyVerified,
      createdAt: this.createdAt
    };
  }

  public toAuthJSON(): Partial<UserAttributes> {
    return {
      id: this.id,
      email: this.email,
      username: this.username,
      firstName: this.firstName,
      lastName: this.lastName,
      role: this.role,
      status: this.status,
      emailVerified: this.emailVerified,
      twoFactorEnabled: this.twoFactorEnabled,
      profileImageUrl: this.profileImageUrl,
      bio: this.bio,
      location: this.location,
      website: this.website,
      talentCategories: this.talentCategories,
      agencyName: this.agencyName,
      agencyVerified: this.agencyVerified,
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
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        len: [3, 50],
        is: /^[a-zA-Z0-9_]+$/
      }
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    firstName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'first_name'
    },
    lastName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'last_name'
    },
    role: {
      type: DataTypes.ENUM(...Object.values(UserRole)),
      defaultValue: UserRole.USER
    },
    status: {
      type: DataTypes.ENUM(...Object.values(UserStatus)),
      defaultValue: UserStatus.PENDING
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
    emailVerificationExpires: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'email_verification_expires'
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
    profileImageUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'profile_image_url'
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    location: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    website: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: {
        isUrl: true
      }
    },
    dateOfBirth: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'date_of_birth'
    },
    talentCategories: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
      field: 'talent_categories'
    },
    agencyName: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'agency_name'
    },
    agencyVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'agency_verified'
    },
    lastLoginAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_login_at'
    },
    loginAttempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'login_attempts'
    },
    lockoutUntil: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'lockout_until'
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
      { fields: ['status'] },
      { fields: ['talent_categories'], using: 'GIN' }
    ],
    hooks: {
      beforeCreate: async (user: User) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS || '12'));
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      beforeUpdate: async (user: User) => {
        if (user.changed('password')) {
          const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS || '12'));
          user.password = await bcrypt.hash(user.password, salt);
        }
      }
    }
  }
);

export default User;
