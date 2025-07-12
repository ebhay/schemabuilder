interface Field {
  id: string
  name: string
  type: 'VARCHAR' | 'INT' | 'BIGINT' | 'DECIMAL' | 'DATE' | 'DATETIME' | 'BOOLEAN' | 'TEXT' | 'JSON'
  length?: number
  precision?: number
  scale?: number
  isPrimary?: boolean
  isRequired?: boolean
  isUnique?: boolean
  isAutoIncrement?: boolean
  defaultValue?: string
  constraints?: {
    minLength?: number
    maxLength?: number
    min?: number
    max?: number
    pattern?: string
  }
}

interface ForeignKeyConstraint {
  id: string
  name: string
  fromEntityId: string
  fromFieldId: string
  toEntityId: string
  toFieldId: string
  onUpdate: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION'
  onDelete: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION'
  relationshipType: 'one-to-one' | 'one-to-many' | 'many-to-many'
}

interface Entity {
  id: string
  name: string
  tableName: string
  fields: Field[]
  position: { x: number; y: number }
  indexes: Index[]
}

interface Index {
  id: string
  name: string
  fields: string[]
  isUnique: boolean
  type: 'BTREE' | 'HASH' | 'FULLTEXT'
}

interface SchemaData {
  schemaId?: string
  name: string
  description: string
  entities: Entity[]
  foreignKeys: ForeignKeyConstraint[]
  databaseEngine: 'MySQL' | 'PostgreSQL' | 'SQLite' | 'SQL Server'
  charset: string
  collation: string
}
