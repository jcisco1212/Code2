import { Model, DataTypes, Optional } from 'sequelize';
import bcrypt from 'bcryptjs';
import { sequelize } from '../config/database';

export enum UserRole {
  USER = 'user',
  CREATOR = 'creator',
  AGENT = 'agent',
  ADMIN = 'admin'
}

interface UserAttributes {
  id: string;
  email: string;
  passwordHash: string;
  username: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  bannerUrl: string | null;
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
  createdAt: Date;
  updatedAt: Date;
}

interface UserCreationAttributes extends Optional<UserAttributes,
  'id' | 'displayName' | 'bio' | 'avatarUrl' | 'bannerUrl' | 'role' |
  'isVerified' | 'isActive' | 'twoFactorEnabled' | 'twoFactorSecret' |
  'emailVerified' | 'emailVerificationToken' | 'passwordResetToken' |
  'passwordResetExpires' | 'lastLogin' | 'createdAt' | 'updatedAt'
> {}

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: string;
  public email!: string;
  public passwordHash!: string;
  public username!: string;
  public displayName!: string | null;
  public bio!: string | null;
  public avatarUrl!: string | null;
  public bannerUrl!: string | null;
  public role!: UserRole;
  public isVerified!: boolean;
  public isActive!: boolean;
  public twoFactorEnabled!: boolean;
  public twoFactorSecret!: string | null;
  public emailVerified!: boolean;
  public emailVerificationToken!: string | null;
  public passwordResetToken!: string | null;
  public passwordResetExpires!: Date | null;
  public lastLogin!: Date | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Instance methods
  public async comparePassword(candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.passwordHash);
  }

  public toPublicJSON(): Partial<UserAttributes> {
    return {
      id: this.id,
      username: this.username,
      displayName: this.displayName,
      role: this.role,
      avatarUrl: this.avatarUrl,
      bio: this.bio,
      isVerified: this.isVerified,
      createdAt: this.createdAt
    };
  }

  public toAuthJSON(): Partial<UserAttributes> {
    return {
      id: this.id,
      email: this.email,
      username: this.username,
      displayName: this.displayName,
      role: this.role,
      isActive: this.isActive,
      emailVerified: this.emailVerified,
      twoFactorEnabled: this.twoFactorEnabled,
      avatarUrl: this.avatarUrl,
      bio: this.bio,
      isVerified: this.isVerified,
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
    role: {
      type: DataTypes.ENUM('user', 'creator', 'agent', 'admin'),
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
      { fields: ['role'] }
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
