import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface CategoryAttributes {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
  icon: string | null;
  iconUrl: string | null;
  color: string | null;
  sortOrder: number;
  isActive: boolean;
  isTalentType: boolean;
  createdAt: Date;
}

interface CategoryCreationAttributes extends Optional<CategoryAttributes,
  'id' | 'description' | 'parentId' | 'icon' | 'iconUrl' | 'color' | 'sortOrder' |
  'isActive' | 'isTalentType' | 'createdAt'
> {}

class Category extends Model<CategoryAttributes, CategoryCreationAttributes> implements CategoryAttributes {
  public id!: string;
  public name!: string;
  public slug!: string;
  public description!: string | null;
  public parentId!: string | null;
  public icon!: string | null;
  public iconUrl!: string | null;
  public color!: string | null;
  public sortOrder!: number;
  public isActive!: boolean;
  public isTalentType!: boolean;
  public readonly createdAt!: Date;
}

Category.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    slug: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    parentId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'parent_id',
      references: {
        model: 'categories',
        key: 'id'
      }
    },
    icon: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    iconUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'icon_url'
    },
    color: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'sort_order'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
    },
    isTalentType: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_talent_type'
    },
    createdAt: {
      type: DataTypes.DATE,
      field: 'created_at'
    }
  },
  {
    sequelize,
    tableName: 'categories',
    modelName: 'Category',
    timestamps: false,
    indexes: [
      { fields: ['slug'], unique: true },
      { fields: ['parent_id'] },
      { fields: ['is_active'] },
      { fields: ['is_talent_type'] },
      { fields: ['sort_order'] }
    ]
  }
);

export default Category;
