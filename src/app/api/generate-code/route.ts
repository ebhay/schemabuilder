import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { schema, databaseType, customPrompt } = body

    if (!schema || !schema.entities || schema.entities.length === 0) {
      return NextResponse.json(
        { error: 'Schema with entities is required' },
        { status: 400 }
      )
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' })
    const basePrompt = buildPrompt(schema, databaseType, customPrompt)

    const result = await model.generateContent(basePrompt)
    const response = await result.response
    const generatedCode = response.text()

    return NextResponse.json({
      code: generatedCode,
      databaseType,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error generating code:', error)
    return NextResponse.json(
      { error: 'Failed to generate code. Please check your API key and try again.' },
      { status: 500 }
    )
  }
}

function buildPrompt(schema: any, databaseType: string, customPrompt?: string): string {
  const schemaJson = JSON.stringify(schema, null, 2)
  
  const databasePrompts = {
    mongodb: `Generate MongoDB schema and queries for the following schema design. Include:
    - Complete Mongoose schema definitions with proper data types
    - Database connection setup
    - Basic CRUD operations (Create, Read, Update, Delete)
    - Proper validation rules and constraints
    - Index definitions for performance
    - Error handling and best practices`,
    
    sql: `Generate SQL DDL statements for the following schema design. Include:
    - Complete CREATE TABLE statements with proper data types
    - Primary key and foreign key constraints
    - Indexes for performance optimization
    - Basic INSERT, UPDATE, DELETE, SELECT queries
    - Proper relationships between tables
    - Data validation constraints`,
    
    supabase: `Generate Supabase schema and TypeScript types for the following schema design. Include:
    - SQL table definitions optimized for Supabase
    - Row Level Security (RLS) policies
    - Complete TypeScript type definitions
    - Basic client-side queries using supabase-js
    - Real-time subscription examples
    - Authentication integration patterns`,
    
    prisma: `Generate Prisma schema for the following schema design. Include:
    - Complete prisma.schema file with proper models
    - Model definitions with correct relationships
    - Prisma client usage examples
    - Database migration commands
    - CRUD operations using Prisma client
    - Advanced query examples`
  }

  const dbPrompt = databasePrompts[databaseType as keyof typeof databasePrompts] || databasePrompts.mongodb

  return `
${customPrompt || dbPrompt}

Schema JSON:
${schemaJson}

Please generate clean, production-ready code with:
- Proper error handling and validation
- Best practices for the chosen database
- Clear comments explaining key parts
- Proper formatting and syntax highlighting
- Complete working examples

Make sure the code is immediately usable and follows industry standards.
  `.trim()
}
