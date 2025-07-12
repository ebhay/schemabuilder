'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import SchemaBuilder from '../page'

export default function SchemaPage() {
  const params = useParams()
  const schemaId = params.schemaId as string

  useEffect(() => {
    // Update the URL without page reload
    if (schemaId && schemaId.length === 6) {
      window.history.replaceState({}, '', `/${schemaId}`)
    }
  }, [schemaId])

  return <SchemaBuilder />
}
