import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

// Verification status levels
export enum VerificationStatus {
  PENDING = 'pending',
  BASIC = 'basic',
  VERIFIED = 'verified',
  PREMIUM = 'premium',
  REJECTED = 'rejected',
  SUSPENDED = 'suspended'
}

// Verification document types
export enum DocumentType {
  GOVERNMENT_ID = 'government_id',
  BUSINESS_LICENSE = 'business_license',
  TALENT_AGENT_LICENSE = 'talent_agent_license',
  SAG_AFTRA_FRANCHISE = 'sag_aftra_franchise',
  AGENCY_LETTERHEAD = 'agency_letterhead',
  IMDB_PRO_SCREENSHOT = 'imdb_pro_screenshot'
}

interface AgentVerificationAttributes {
  id: string;
  userId: string;

  // Basic Info
  agencyName: string;
  agencyWebsite: string | null;
  agencyEmail: string;
  agencyPhone: string;
  agencyAddress: string;
  jobTitle: string;
  yearsInIndustry: number;

  // Verification Status
  status: VerificationStatus;
  verificationLevel: number; // 0-100 trust score

  // License Information
  stateLicenseNumber: string | null;
  stateLicenseState: string | null;
  stateLicenseVerified: boolean;
  stateLicenseExpiry: Date | null;

  // SAG-AFTRA
  sagAftraFranchised: boolean;
  sagAftraVerified: boolean;

  // IMDb
  imdbProLink: string | null;
  imdbVerified: boolean;

  // LinkedIn
  linkedinUrl: string | null;
  linkedinVerified: boolean;

  // Documents
  documentsSubmitted: string[]; // Array of document types submitted
  documentsVerified: string[]; // Array of verified document types

  // Red Flags
  redFlagCount: number;
  redFlagReasons: string[];

  // Reviews from talent
  averageRating: number;
  totalReviews: number;
  successfulPlacements: number; // Verified job placements

  // Admin
  verifiedBy: string | null;
  verifiedAt: Date | null;
  rejectionReason: string | null;
  notes: string | null;

  createdAt?: Date;
  updatedAt?: Date;
}

interface AgentVerificationCreationAttributes extends Optional<AgentVerificationAttributes,
  'id' | 'status' | 'verificationLevel' | 'stateLicenseNumber' | 'stateLicenseState' |
  'stateLicenseVerified' | 'stateLicenseExpiry' | 'sagAftraFranchised' | 'sagAftraVerified' |
  'imdbProLink' | 'imdbVerified' | 'linkedinUrl' | 'linkedinVerified' | 'documentsSubmitted' |
  'documentsVerified' | 'redFlagCount' | 'redFlagReasons' | 'averageRating' | 'totalReviews' |
  'successfulPlacements' | 'verifiedBy' | 'verifiedAt' | 'rejectionReason' | 'notes' |
  'agencyWebsite'
> {}

class AgentVerification extends Model<AgentVerificationAttributes, AgentVerificationCreationAttributes>
  implements AgentVerificationAttributes {
  public id!: string;
  public userId!: string;

  public agencyName!: string;
  public agencyWebsite!: string | null;
  public agencyEmail!: string;
  public agencyPhone!: string;
  public agencyAddress!: string;
  public jobTitle!: string;
  public yearsInIndustry!: number;

  public status!: VerificationStatus;
  public verificationLevel!: number;

  public stateLicenseNumber!: string | null;
  public stateLicenseState!: string | null;
  public stateLicenseVerified!: boolean;
  public stateLicenseExpiry!: Date | null;

  public sagAftraFranchised!: boolean;
  public sagAftraVerified!: boolean;

  public imdbProLink!: string | null;
  public imdbVerified!: boolean;

  public linkedinUrl!: string | null;
  public linkedinVerified!: boolean;

  public documentsSubmitted!: string[];
  public documentsVerified!: string[];

  public redFlagCount!: number;
  public redFlagReasons!: string[];

  public averageRating!: number;
  public totalReviews!: number;
  public successfulPlacements!: number;

  public verifiedBy!: string | null;
  public verifiedAt!: Date | null;
  public rejectionReason!: string | null;
  public notes!: string | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Calculate trust score based on verifications
  public calculateTrustScore(): number {
    let score = 0;

    // Base score for completing profile
    score += 10;

    // Email from agency domain (not gmail, etc.)
    if (this.agencyEmail && !this.agencyEmail.match(/@(gmail|yahoo|hotmail|outlook)\./i)) {
      score += 10;
    }

    // Has agency website
    if (this.agencyWebsite) score += 5;

    // State license verified
    if (this.stateLicenseVerified) score += 20;

    // SAG-AFTRA franchised
    if (this.sagAftraVerified) score += 25;

    // IMDb Pro verified
    if (this.imdbVerified) score += 10;

    // LinkedIn verified
    if (this.linkedinVerified) score += 5;

    // Documents verified
    score += this.documentsVerified.length * 3;

    // Good reviews
    if (this.totalReviews >= 5 && this.averageRating >= 4.0) score += 10;
    if (this.totalReviews >= 20 && this.averageRating >= 4.5) score += 10;

    // Successful placements
    score += Math.min(this.successfulPlacements * 2, 20);

    // Deduct for red flags
    score -= this.redFlagCount * 15;

    // Years in industry bonus
    score += Math.min(this.yearsInIndustry, 10);

    return Math.max(0, Math.min(100, score));
  }

  // Check if agent can contact talent
  public canContactTalent(): boolean {
    return this.status === VerificationStatus.VERIFIED ||
           this.status === VerificationStatus.PREMIUM;
  }

  // Get verification badge level
  public getBadgeLevel(): string {
    if (this.status === VerificationStatus.PREMIUM) return 'gold';
    if (this.status === VerificationStatus.VERIFIED) return 'silver';
    if (this.status === VerificationStatus.BASIC) return 'bronze';
    return 'none';
  }
}

AgentVerification.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    agencyName: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    agencyWebsite: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    agencyEmail: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    agencyPhone: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    agencyAddress: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    jobTitle: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    yearsInIndustry: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(VerificationStatus)),
      defaultValue: VerificationStatus.PENDING,
    },
    verificationLevel: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    stateLicenseNumber: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    stateLicenseState: {
      type: DataTypes.STRING(2),
      allowNull: true,
    },
    stateLicenseVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    stateLicenseExpiry: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    sagAftraFranchised: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    sagAftraVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    imdbProLink: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    imdbVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    linkedinUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    linkedinVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    documentsSubmitted: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
    },
    documentsVerified: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
    },
    redFlagCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    redFlagReasons: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
    },
    averageRating: {
      type: DataTypes.DECIMAL(3, 2),
      defaultValue: 0,
    },
    totalReviews: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    successfulPlacements: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    verifiedBy: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    verifiedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    rejectionReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'agent_verifications',
    timestamps: true,
  }
);

export default AgentVerification;
