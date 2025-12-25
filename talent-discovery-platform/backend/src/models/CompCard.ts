import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface CompCardStats {
  height?: string;
  weight?: string;
  eyeColor?: string;
  hairColor?: string;
  shoeSize?: string;
  dressSize?: string;
  suitSize?: string;
  bustWaistHips?: string;
  vocalRange?: string;
  instruments?: string[];
  languages?: string[];
  accents?: string[];
  specialSkills?: string[];
}

export interface CompCardExperience {
  title: string;
  role: string;
  year?: string;
  director?: string;
  production?: string;
}

export interface CompCardTraining {
  institution: string;
  degree?: string;
  field: string;
  year?: string;
}

interface CompCardAttributes {
  id: string;
  userId: string;
  title: string;
  tagline: string | null;
  headshots: string[];
  stats: CompCardStats | null;
  experience: CompCardExperience[];
  training: CompCardTraining[];
  featuredVideoIds: string[];
  unionMemberships: string[];
  representation: string | null;
  customSections: Record<string, string> | null;
  shareToken: string;
  isPublic: boolean;
  viewCount: number;
  lastGeneratedPdf: string | null;
  pdfGeneratedAt: Date | null;
  template: string;
  colorScheme: string;
  createdAt: Date;
  updatedAt: Date;
}

interface CompCardCreationAttributes extends Optional<CompCardAttributes,
  'id' | 'tagline' | 'headshots' | 'stats' | 'experience' | 'training' |
  'featuredVideoIds' | 'unionMemberships' | 'representation' | 'customSections' |
  'shareToken' | 'isPublic' | 'viewCount' | 'lastGeneratedPdf' | 'pdfGeneratedAt' |
  'template' | 'colorScheme' | 'createdAt' | 'updatedAt'
> {}

class CompCard extends Model<CompCardAttributes, CompCardCreationAttributes> implements CompCardAttributes {
  declare id: string;
  declare userId: string;
  declare title: string;
  declare tagline: string | null;
  declare headshots: string[];
  declare stats: CompCardStats | null;
  declare experience: CompCardExperience[];
  declare training: CompCardTraining[];
  declare featuredVideoIds: string[];
  declare unionMemberships: string[];
  declare representation: string | null;
  declare customSections: Record<string, string> | null;
  declare shareToken: string;
  declare isPublic: boolean;
  declare viewCount: number;
  declare lastGeneratedPdf: string | null;
  declare pdfGeneratedAt: Date | null;
  declare template: string;
  declare colorScheme: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // Associations
  declare user?: any;
  declare featuredVideos?: any[];

  toPublicJSON() {
    return {
      id: this.id,
      userId: this.userId,
      title: this.title,
      tagline: this.tagline,
      headshots: this.headshots,
      stats: this.stats,
      experience: this.experience,
      training: this.training,
      featuredVideoIds: this.featuredVideoIds,
      unionMemberships: this.unionMemberships,
      representation: this.representation,
      customSections: this.customSections,
      shareToken: this.shareToken,
      isPublic: this.isPublic,
      template: this.template,
      colorScheme: this.colorScheme,
      viewCount: this.viewCount,
      user: this.user,
      featuredVideos: this.featuredVideos,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

// Generate a unique share token
const generateShareToken = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let token = '';
  for (let i = 0; i < 12; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
};

CompCard.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: 'My Comp Card'
    },
    tagline: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    headshots: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    stats: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    experience: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    training: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    featuredVideoIds: {
      type: DataTypes.JSONB,
      defaultValue: [],
      field: 'featured_video_ids'
    },
    unionMemberships: {
      type: DataTypes.JSONB,
      defaultValue: [],
      field: 'union_memberships'
    },
    representation: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    customSections: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: 'custom_sections'
    },
    shareToken: {
      type: DataTypes.STRING(20),
      unique: true,
      defaultValue: generateShareToken,
      field: 'share_token'
    },
    isPublic: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_public'
    },
    viewCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'view_count'
    },
    lastGeneratedPdf: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'last_generated_pdf'
    },
    pdfGeneratedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'pdf_generated_at'
    },
    template: {
      type: DataTypes.STRING(50),
      defaultValue: 'classic'
    },
    colorScheme: {
      type: DataTypes.STRING(50),
      defaultValue: 'professional',
      field: 'color_scheme'
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
    tableName: 'comp_cards',
    modelName: 'CompCard',
    indexes: [
      { fields: ['user_id'] },
      { fields: ['share_token'], unique: true },
      { fields: ['is_public'] }
    ]
  }
);

export default CompCard;
