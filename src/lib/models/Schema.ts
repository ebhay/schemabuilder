import mongoose from 'mongoose'

// Helper function to generate unique 6-digit ID
async function generateUniqueId(): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const id = Math.floor(100000 + Math.random() * 900000).toString()
    const exists = await mongoose.models.Schema?.exists({ schemaId: id })
    if (!exists) {
      console.log(`✅ Generated unique schemaId: ${id}`)
      return id
    }
    console.log(`🔄 SchemaId ${id} already exists, retrying...`)
  }
  // Fallback to timestamp-based ID
  const fallbackId = Date.now().toString().slice(-6)
  console.warn(`⚠️ Using fallback schemaId: ${fallbackId}`)
  return fallbackId
}

const fieldSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  type: { type: String, required: true },
  isRequired: { type: Boolean, default: false },
  isPrimary: { type: Boolean, default: false },
  isUnique: { type: Boolean, default: false },
  defaultValue: String,
})

const entitySchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  fields: [fieldSchema],
  position: {
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 }
  },
})

const relationshipSchema = new mongoose.Schema({
  id: { type: String, required: true },
  fromEntity: { type: String, required: true },
  toEntity: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['one-to-one', 'one-to-many', 'many-to-many'],
    required: true 
  },
})

const schemaSchema = new mongoose.Schema({
  schemaId: {
    type: String,
    unique: true,
    default: generateUniqueId, // Auto-generate on creation
  },
  name: { type: String, required: true },
  description: String,
  entities: [entitySchema],
  relationships: [relationshipSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  lastModified: { type: Date, default: Date.now }
})

// Ensure schemaId exists before validation
schemaSchema.pre('validate', async function() {
  if (!this.schemaId) {
    this.schemaId = await generateUniqueId()
  }
})

// Update timestamps on save
schemaSchema.pre('save', function() {
  this.updatedAt = new Date()
  this.lastModified = new Date()
})

export const Schema = mongoose.models.Schema || mongoose.model('Schema', schemaSchema)
