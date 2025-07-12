'use client'

import { useState, useCallback, useRef } from 'react'

interface UseUndoRedoOptions<T> {
  initialState: T
  maxHistorySize?: number
}

export function useUndoRedo<T>({ 
  initialState, 
  maxHistorySize = 50 
}: UseUndoRedoOptions<T>) {
  const [history, setHistory] = useState<T[]>([initialState])
  const [currentIndex, setCurrentIndex] = useState(0)
  const isUpdating = useRef(false)

  const currentState = history[currentIndex]

  const pushState = useCallback((newState: T) => {
    if (isUpdating.current) return

    setHistory(prev => {
      const newHistory = prev.slice(0, currentIndex + 1)
      newHistory.push(newState)
      
      if (newHistory.length > maxHistorySize) {
        newHistory.shift()
        return newHistory
      }
      
      return newHistory
    })
    
    setCurrentIndex(prev => Math.min(prev + 1, maxHistorySize - 1))
  }, [currentIndex, maxHistorySize])

  const undo = useCallback(() => {
    if (currentIndex > 0) {
      isUpdating.current = true
      setCurrentIndex(prev => prev - 1)
      setTimeout(() => { isUpdating.current = false }, 0)
    }
  }, [currentIndex])

  const redo = useCallback(() => {
    if (currentIndex < history.length - 1) {
      isUpdating.current = true
      setCurrentIndex(prev => prev + 1)
      setTimeout(() => { isUpdating.current = false }, 0)
    }
  }, [currentIndex, history.length])

  return {
    state: currentState,
    pushState,
    undo,
    redo,
    canUndo: currentIndex > 0,
    canRedo: currentIndex < history.length - 1
  }
}
