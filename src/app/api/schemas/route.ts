import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { Schema } from '@/lib/models/Schema'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const schemaId = searchParams.get('id')

    await clientPromise

    if (schemaId) {
      const schema = await Schema.findOne({ schemaId })
      if (!schema) {
        return NextResponse.json(
          { error: 'Schema not found' },
          { status: 404 }
        )
      }
      return NextResponse.json(schema)
    }

    const schemas = await Schema.find({}).sort({ updatedAt: -1 })
    return NextResponse.json(schemas)
  } catch (error) {
    console.error('Error fetching schemas:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, entities = [], relationships = [] } = body

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { error: 'Schema name is required and must be a non-empty string' },
        { status: 400 }
      )
    }

    await clientPromise

    console.log('💾 Creating new schema:', { name: name.trim() })

    const schema = await Schema.create({
      name: name.trim(),
      description: description || '',
      entities,
      relationships
    })
    
    console.log('✅ Schema created successfully with ID:', schema.schemaId)
    return NextResponse.json(schema, { status: 201 })
  } catch (error: any) { // FIXED: Added type annotation
    console.error('Error creating schema:', error)
    
    // FIXED: Proper error type checking
    if (error?.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors || {}).map((err: any) => ({
        field: err?.path || 'unknown',
        message: err?.message || 'Validation failed'
      }))
      
      return NextResponse.json(
        { error: 'Schema validation failed', details: validationErrors },
        { status: 400 }
      )
    }
    
    // FIXED: Proper duplicate key error handling
    if (error?.code === 11000) {
      return NextResponse.json(
        { error: 'Schema ID already exists. Please try again.' },
        { status: 409 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to create schema. Please try again.' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { schemaId, ...updates } = body

    if (!schemaId) {
      return NextResponse.json(
        { error: 'Schema ID is required for updates' },
        { status: 400 }
      )
    }

    await clientPromise

    const schema = await Schema.findOneAndUpdate(
      { schemaId },
      { ...updates, lastModified: new Date() },
      { new: true, runValidators: true }
    )

    if (!schema) {
      return NextResponse.json(
        { error: 'Schema not found' },
        { status: 404 }
      )
    }

    console.log('✅ Schema updated successfully:', schemaId)
    return NextResponse.json(schema)
  } catch (error: any) { // FIXED: Added type annotation
    console.error('Error updating schema:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const schemaId = searchParams.get('id')

    if (!schemaId) {
      return NextResponse.json(
        { error: 'Schema ID is required for deletion' },
        { status: 400 }
      )
    }

    await clientPromise

    const result = await Schema.deleteOne({ schemaId })
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Schema not found' },
        { status: 404 }
      )
    }

    console.log('✅ Schema deleted successfully:', schemaId)
    return NextResponse.json({ message: 'Schema deleted successfully' })
  } catch (error: any) { // FIXED: Added type annotation
    console.error('Error deleting schema:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// FIXED: Simplified CORS handlers
export async function OPTIONS() {
  return new NextResponse(null, { 
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
