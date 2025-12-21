import { Model, DataTypes, Sequelize } from 'sequelize';

export enum AnnouncementType {
  INFO = 'info',
  WARNING = 'warning',
  SUCCESS = 'success',
  ERROR = 'error'
}

export enum AnnouncementTarget {
  ALL = 'all',
  CREATORS = 'creators',
  AGENTS = 'agents',
  ADMINS = 'admins'
}

interface AnnouncementAttributes {
  id: string;
  title: string;
  content: string;
  type: AnnouncementType;
  target: AnnouncementTarget;
  isActive: boolean;
  isPinned: boolean;
  startsAt: Date | null;
  expiresAt: Date | null;
  createdBy: string;
}

interface AnnouncementCreationAttributes extends Omit<AnnouncementAttributes, 'id' | 'isActive' | 'isPinned'> {}

class Announcement extends Model<AnnouncementAttributes, AnnouncementCreationAttributes> implements AnnouncementAttributes {
  public id!: string;
  public title!: string;
  public content!: string;
  public type!: AnnouncementType;
  public target!: AnnouncementTarget;
  public isActive!: boolean;
  public isPinned!: boolean;
  public startsAt!: Date | null;
  public expiresAt!: Date | null;
  public createdBy!: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export const initAnnouncement = (sequelize: Sequelize) => {
  Announcement.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      type: {
        type: DataTypes.ENUM(...Object.values(AnnouncementType)),
        defaultValue: AnnouncementType.INFO
      },
      target: {
        type: DataTypes.ENUM(...Object.values(AnnouncementTarget)),
        defaultValue: AnnouncementTarget.ALL
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      isPinned: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      startsAt: {
        type: DataTypes.DATE,
        allowNull: true
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: true
      },
      createdBy: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' }
      }
    },
    {
      sequelize,
      tableName: 'announcements',
      indexes: [
        { fields: ['isActive', 'target'] },
        { fields: ['isPinned'] },
        { fields: ['expiresAt'] }
      ]
    }
  );

  return Announcement;
};

export default Announcement;
