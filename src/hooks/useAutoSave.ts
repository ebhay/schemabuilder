'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useDebounce } from 'use-debounce'
import toast from 'react-hot-toast'

interface UseAutoSaveOptions {
  data: any
  onSave: (data: any) => Promise<void>
  delay?: number
  enabled?: boolean
}

export function useAutoSave({ 
  data, 
  onSave, 
  delay = 2000, 
  enabled = true 
}: UseAutoSaveOptions) {
  const [debouncedData] = useDebounce(data, delay)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  
  // Track the last saved data hash to detect actual changes
  const lastSavedHashRef = useRef<string | null>(null)
  const initialRender = useRef(true)
  const savingRef = useRef(false)

  // Create stable hash of data excluding volatile fields
  const createDataHash = useCallback((data: any): string => {
    const { lastModified, updatedAt, ...cleanData } = data || {}
    return JSON.stringify(cleanData, Object.keys(cleanData).sort())
  }, [])

  const saveData = useCallback(async (dataToSave: any) => {
    if (savingRef.current || !enabled) return
    
    const currentHash = createDataHash(dataToSave)
    
    // Only save if data has actually changed
    if (lastSavedHashRef.current === currentHash) {
      console.log('🚫 Auto-save skipped: No changes detected')
      return
    }

    // Validate data before saving
    if (!dataToSave || !dataToSave.name || dataToSave.name.trim() === '') {
      console.log('🚫 Auto-save skipped: Invalid schema data')
      return
    }

    try {
      savingRef.current = true
      setIsSaving(true)
      
      console.log('💾 Auto-saving changes...')
      await onSave(dataToSave)
      
      lastSavedHashRef.current = currentHash
      setLastSaved(new Date())
      
      toast.success('Changes saved automatically', { 
        duration: 2000,
        icon: '💾'
      })
    } catch (error) {
      console.error('Auto-save failed:', error)
      toast.error('Failed to save changes')
    } finally {
      setIsSaving(false)
      savingRef.current = false
    }
  }, [onSave, enabled, createDataHash])

  useEffect(() => {
    if (initialRender.current) {
      initialRender.current = false
      lastSavedHashRef.current = createDataHash(debouncedData)
      console.log('🏁 Auto-save initialized with baseline data')
      return
    }

    if (!enabled || !debouncedData || savingRef.current) return

    saveData(debouncedData)
  }, [debouncedData, enabled, saveData])

  const markAsSaved = useCallback((data: any) => {
    lastSavedHashRef.current = createDataHash(data)
    setLastSaved(new Date())
  }, [createDataHash])

  return { isSaving, lastSaved, markAsSaved }
}
