'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Navbar } from '@/components/navigation/Navbar'
import { EntityCard } from '@/components/entities/EntityCard'
import { CodeGenModal } from '@/components/modals/CodeGenModal'
import { RelationshipSelector } from '@/components/relationships/RelationshipSelector'
import { DiagramExporter } from '@/components/export/DiagramExporter'
import { useAutoSave } from '@/hooks/useAutoSave'
import { useUndoRedo } from '@/hooks/useUndoRedo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  rectSortingStrategy,
} from '@dnd-kit/sortable'
import { 
  Undo, 
  Redo, 
  Plus,
  Code,
  Sparkles,
  Zap,
  Link2,
  X,
  ArrowRight,
  Trash2
} from 'lucide-react'
import toast from 'react-hot-toast'

interface Field {
  id: string
  name: string
  type: string
  isPrimary?: boolean
  isRequired?: boolean
  isUnique?: boolean
}

interface Entity {
  id: string
  name: string
  fields: Field[]
  position: { x: number; y: number }
}

interface Relationship {
  id: string
  fromEntity: string
  toEntity: string
  type: 'one-to-one' | 'one-to-many' | 'many-to-many'
}

interface SchemaData {
  schemaId?: string
  name: string
  description: string
  entities: Entity[]
  relationships: Relationship[]
}

// Relationship Arrow Component
function RelationshipArrow({ 
  relationship, 
  fromEntity, 
  toEntity, 
  onDelete 
}: { 
  relationship: Relationship
  fromEntity: Entity
  toEntity: Entity
  onDelete: (id: string) => void
}) {
  const fromCenter = {
    x: fromEntity.position.x + 128, // Half of entity card width (256px / 2)
    y: fromEntity.position.y + 60   // Approximate center height
  }
  
  const toCenter = {
    x: toEntity.position.x + 128,
    y: toEntity.position.y + 60
  }

  // Calculate arrow path
  const dx = toCenter.x - fromCenter.x
  const dy = toCenter.y - fromCenter.y
  const distance = Math.sqrt(dx * dx + dy * dy)
  
  // Normalize direction
  const unitX = dx / distance
  const unitY = dy / distance
  
  // Offset from entity edges
  const offset = 80
  const startX = fromCenter.x + unitX * offset
  const startY = fromCenter.y + unitY * offset
  const endX = toCenter.x - unitX * offset
  const endY = toCenter.y - unitY * offset

  // Arrow head calculations
  const arrowLength = 12
  const arrowAngle = Math.PI / 6
  const angle = Math.atan2(dy, dx)
  
  const arrowX1 = endX - arrowLength * Math.cos(angle - arrowAngle)
  const arrowY1 = endY - arrowLength * Math.sin(angle - arrowAngle)
  const arrowX2 = endX - arrowLength * Math.cos(angle + arrowAngle)
  const arrowY2 = endY - arrowLength * Math.sin(angle + arrowAngle)

  // Midpoint for relationship type label
  const midX = (startX + endX) / 2
  const midY = (startY + endY) / 2

  const getRelationshipColor = (type: string) => {
    switch (type) {
      case 'one-to-one': return '#10b981' // green
      case 'one-to-many': return '#3b82f6' // blue  
      case 'many-to-many': return '#8b5cf6' // purple
      default: return '#6b7280' // gray
    }
  }

  const getRelationshipIcon = (type: string) => {
    switch (type) {
      case 'one-to-one': return '1:1'
      case 'one-to-many': return '1:N'
      case 'many-to-many': return 'N:M'
      default: return '?'
    }
  }

  const color = getRelationshipColor(relationship.type)

  return (
    <g className="relationship-arrow">
      {/* Main line */}
      <line
        x1={startX}
        y1={startY}
        x2={endX}
        y2={endY}
        stroke={color}
        strokeWidth="2"
        markerEnd="url(#arrowhead)"
        className="transition-all duration-200 hover:stroke-width-3"
      />
      
      {/* Arrow head */}
      <polygon
        points={`${endX},${endY} ${arrowX1},${arrowY1} ${arrowX2},${arrowY2}`}
        fill={color}
      />
      
      {/* Relationship type badge */}
      <g transform={`translate(${midX}, ${midY})`}>
        <rect
          x="-20"
          y="-12"
          width="40"
          height="24"
          rx="12"
          fill="white"
          stroke={color}
          strokeWidth="2"
          className="drop-shadow-sm"
        />
        <text
          x="0"
          y="0"
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="10"
          fontWeight="600"
          fill={color}
        >
          {getRelationshipIcon(relationship.type)}
        </text>
      </g>
      
      {/* Delete button */}
      <g 
        transform={`translate(${midX + 25}, ${midY - 25})`}
        className="cursor-pointer opacity-0 hover:opacity-100 transition-opacity"
        onClick={() => onDelete(relationship.id)}
      >
        <circle
          cx="0"
          cy="0"
          r="10"
          fill="#ef4444"
          className="hover:fill-red-600"
        />
        <text
          x="0"
          y="0"
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="12"
          fill="white"
          fontWeight="bold"
        >
          ×
        </text>
      </g>
    </g>
  )
}

export default function SchemaBuilder() {
  const [activeEntityId, setActiveEntityId] = useState<string | null>(null)
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null)
  const [isEditingName, setIsEditingName] = useState(false)
  const [editedSchemaName, setEditedSchemaName] = useState('')
  const [currentSchemaId, setCurrentSchemaId] = useState<string | null>(null)
  const [isSchemaLoaded, setIsSchemaLoaded] = useState(false)
  const [draggedEntity, setDraggedEntity] = useState<Entity | null>(null)
  const [isRelationshipMode, setIsRelationshipMode] = useState(false)
  const [selectedEntityForRelation, setSelectedEntityForRelation] = useState<string | null>(null)
  const [relationshipSelectorOpen, setRelationshipSelectorOpen] = useState(false)
  const [pendingRelationship, setPendingRelationship] = useState<{
    from: Entity | null
    to: Entity | null
  }>({ from: null, to: null })

  const canvasRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  const initialSchema: SchemaData = {
    name: 'Untitled Schema',
    description: 'A new database schema',
    entities: [],
    relationships: []
  }

  const {
    state: schemaData,
    pushState,
    undo,
    redo,
    canUndo,
    canRedo
  } = useUndoRedo({
    initialState: initialSchema
  })

  // Auto-save with change detection
  const { isSaving, lastSaved, markAsSaved } = useAutoSave({
    data: { ...schemaData, schemaId: currentSchemaId },
    onSave: async (data) => {
      try {
        const response = await fetch('/api/schemas', {
          method: data.schemaId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        })
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to save schema')
        }
        
        const savedSchema = await response.json()
        
        if (!data.schemaId && savedSchema.schemaId) {
          setCurrentSchemaId(savedSchema.schemaId)
        }
      } catch (error) {
        console.error('Save error:', error)
        throw error
      }
    },
    enabled: isSchemaLoaded
  })

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor)
  )

  // Load schema from URL
  useEffect(() => {
    const loadSchema = async () => {
      const pathSegments = window.location.pathname.split('/')
      const urlSchemaId = pathSegments[1]
      
      if (urlSchemaId && urlSchemaId !== '' && urlSchemaId.length === 6) {
        try {
          const response = await fetch(`/api/schemas?id=${urlSchemaId}`)
          if (response.ok) {
            const loadedSchema = await response.json()
            setCurrentSchemaId(loadedSchema.schemaId)
            pushState(loadedSchema)
            markAsSaved(loadedSchema)
            console.log('📂 Schema loaded from server')
          }
        } catch (error) {
          console.error('Failed to load schema:', error)
        }
      }
      setIsSchemaLoaded(true)
    }

    loadSchema()
  }, [pushState, markAsSaved])

  useEffect(() => {
    setEditedSchemaName(schemaData.name)
  }, [schemaData.name])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isRelationshipMode) {
        handleCancelRelationshipMode()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isRelationshipMode])

  // Drag handlers
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event
    setActiveEntityId(active.id as string)
    
    const entity = schemaData.entities.find(e => e.id === active.id)
    if (entity) {
      setDraggedEntity(entity)
    }
  }, [schemaData.entities])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, delta } = event
    
    setActiveEntityId(null)
    setDraggedEntity(null)

    if (!delta || (delta.x === 0 && delta.y === 0)) return

    const entityId = active.id as string
    const entity = schemaData.entities.find(e => e.id === entityId)
    
    if (!entity) return

    const newPosition = {
      x: Math.max(0, entity.position.x + delta.x),
      y: Math.max(0, entity.position.y + delta.y)
    }

    const updatedEntities = schemaData.entities.map(e =>
      e.id === entityId 
        ? { ...e, position: newPosition }
        : e
    )

    pushState({
      ...schemaData,
      entities: updatedEntities
    })
  }, [schemaData, pushState])

  // Entity management
  const handleAddEntity = useCallback(() => {
    const canvasRect = canvasRef.current?.getBoundingClientRect()
    const baseX = canvasRect ? 50 : 100
    const baseY = canvasRect ? 50 : 100
    
    const newEntity: Entity = {
      id: `entity_${Date.now()}`,
      name: 'NewEntity',
      fields: [
        {
          id: 'id',
          name: 'id',
          type: 'string',
          isPrimary: true,
          isRequired: true
        }
      ],
      position: { 
        x: baseX + (schemaData.entities.length * 80), 
        y: baseY + (schemaData.entities.length * 50)
      }
    }

    pushState({
      ...schemaData,
      entities: [...schemaData.entities, newEntity]
    })

    toast.success('Entity added successfully!')
  }, [schemaData, pushState])

  const handleEntityUpdate = useCallback((updatedEntity: Entity) => {
    const currentEntity = schemaData.entities.find(e => e.id === updatedEntity.id)
    
    if (JSON.stringify(currentEntity) === JSON.stringify(updatedEntity)) return

    const updatedEntities = schemaData.entities.map(entity =>
      entity.id === updatedEntity.id ? updatedEntity : entity
    )
    
    pushState({
      ...schemaData,
      entities: updatedEntities
    })
  }, [schemaData, pushState])

  const handleEntityDelete = useCallback((entityId: string) => {
    const updatedEntities = schemaData.entities.filter(
      entity => entity.id !== entityId
    )
    
    // Also remove relationships involving this entity
    const updatedRelationships = schemaData.relationships.filter(
      rel => rel.fromEntity !== entityId && rel.toEntity !== entityId
    )
    
    pushState({
      ...schemaData,
      entities: updatedEntities,
      relationships: updatedRelationships
    })
    
    if (selectedEntityId === entityId) {
      setSelectedEntityId(null)
    }

    toast.success('Entity deleted successfully!')
  }, [schemaData, pushState, selectedEntityId])

  // Enhanced relationship creation flow
  const handleStartRelationshipMode = () => {
    setIsRelationshipMode(true)
    setSelectedEntityForRelation(null)
    toast.success('Click on two entities to create a relationship', {
      duration: 4000,
      icon: '🔗'
    })
  }

  const handleEntityClickForRelation = useCallback((entityId: string) => {
    if (!selectedEntityForRelation) {
      // First entity selected
      setSelectedEntityForRelation(entityId)
      const entity = schemaData.entities.find(e => e.id === entityId)
      toast.success(`Selected "${entity?.name}". Now click another entity to connect.`, {
        duration: 3000,
        icon: '✅'
      })
    } else if (selectedEntityForRelation !== entityId) {
      // Second entity selected - open relationship selector
      const fromEntity = schemaData.entities.find(e => e.id === selectedEntityForRelation)
      const toEntity = schemaData.entities.find(e => e.id === entityId)
      
      if (fromEntity && toEntity) {
        // Check if relationship already exists
        const existingRelationship = schemaData.relationships.find(rel => 
          (rel.fromEntity === selectedEntityForRelation && rel.toEntity === entityId) ||
          (rel.fromEntity === entityId && rel.toEntity === selectedEntityForRelation)
        )

        if (existingRelationship) {
          toast.error('Relationship already exists between these entities')
          setIsRelationshipMode(false)
          setSelectedEntityForRelation(null)
          return
        }

        setPendingRelationship({ from: fromEntity, to: toEntity })
        setRelationshipSelectorOpen(true)
        setIsRelationshipMode(false)
        setSelectedEntityForRelation(null)
      }
    } else {
      // Same entity clicked - deselect
      setSelectedEntityForRelation(null)
      toast('Entity deselected. Click another entity to connect.', {
        icon: '↩️'
      })
    }
  }, [selectedEntityForRelation, schemaData.entities, schemaData.relationships])

  const handleCancelRelationshipMode = () => {
    setIsRelationshipMode(false)
    setSelectedEntityForRelation(null)
    toast('Relationship mode cancelled', { icon: '❌' })
  }

  const handleCreateRelationship = useCallback((type: 'one-to-one' | 'one-to-many' | 'many-to-many') => {
    if (pendingRelationship.from && pendingRelationship.to) {
      const newRelationship: Relationship = {
        id: `rel_${Date.now()}`,
        fromEntity: pendingRelationship.from.id,
        toEntity: pendingRelationship.to.id,
        type
      }

      pushState({
        ...schemaData,
        relationships: [...schemaData.relationships, newRelationship]
      })

      toast.success(`${type.replace('-', ' ')} relationship created between ${pendingRelationship.from.name} and ${pendingRelationship.to.name}`)
      
      setPendingRelationship({ from: null, to: null })
    }
  }, [pendingRelationship, schemaData, pushState])

  const handleDeleteRelationship = useCallback((relationshipId: string) => {
    const updatedRelationships = schemaData.relationships.filter(
      rel => rel.id !== relationshipId
    )

    pushState({
      ...schemaData,
      relationships: updatedRelationships
    })

    toast.success('Relationship deleted successfully!')
  }, [schemaData, pushState])

  // Other handlers
  const handleNewSchema = useCallback(() => {
    pushState(initialSchema)
    setSelectedEntityId(null)
    setCurrentSchemaId(null)
    toast.success('New schema created!')
  }, [pushState, initialSchema])

  const handleShare = useCallback(() => {
    if (currentSchemaId) {
      const shareUrl = `${window.location.origin}/${currentSchemaId}`
      navigator.clipboard.writeText(shareUrl)
      toast.success('Share link copied to clipboard!')
    } else {
      toast.error('Please save the schema first')
    }
  }, [currentSchemaId])

  const handleExport = useCallback(() => {
    const dataStr = JSON.stringify(schemaData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${schemaData.name.replace(/\s+/g, '-').toLowerCase()}.json`
    link.click()
    URL.revokeObjectURL(url)
    toast.success('Schema exported successfully!')
  }, [schemaData])

  const handleImport = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          try {
            const importedSchema = JSON.parse(e.target?.result as string)
            pushState(importedSchema)
            toast.success('Schema imported successfully!')
          } catch (error) {
            toast.error('Invalid JSON file')
          }
        }
        reader.readAsText(file)
      }
    }
    input.click()
  }, [pushState])

  const handleSchemaNameSave = useCallback(() => {
    if (editedSchemaName.trim() === schemaData.name.trim()) {
      setIsEditingName(false)
      return
    }

    pushState({
      ...schemaData,
      name: editedSchemaName.trim()
    })
    setIsEditingName(false)
  }, [editedSchemaName, schemaData, pushState])

  return (
    <div className="h-screen flex flex-col gradient-bg overflow-hidden">
      <Navbar
        onNewSchema={handleNewSchema}
        onShare={handleShare}
        onExport={handleExport}
        onImport={handleImport}
        currentSchemaName={schemaData.name}
        lastSaved={lastSaved}
        isSaving={isSaving}
      />

      {/* Schema Header */}
      <div className="glass-effect border-b px-6 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {isEditingName ? (
              <Input
                value={editedSchemaName}
                onChange={(e) => setEditedSchemaName(e.target.value)}
                onBlur={handleSchemaNameSave}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSchemaNameSave()
                  if (e.key === 'Escape') {
                    setEditedSchemaName(schemaData.name)
                    setIsEditingName(false)
                  }
                }}
                className="text-xl font-bold bg-transparent border-none p-0 h-auto focus-visible:ring-1"
                autoFocus
              />
            ) : (
              <h1 
                className="text-xl font-bold cursor-pointer hover:text-primary transition-colors"
                onClick={() => setIsEditingName(true)}
              >
                {schemaData.name}
              </h1>
            )}
            
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <span>{schemaData.entities.length} entities</span>
              <span>•</span>
              <span>{schemaData.relationships.length} relationships</span>
              {currentSchemaId && (
                <>
                  <span>•</span>
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                    ID: {currentSchemaId}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Status Bar */}
      <div className="glass-effect border-b px-6 py-2 flex-shrink-0">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-3">
            {isSaving && (
              <span className="text-amber-600 text-xs flex items-center">
                <div className="animate-spin h-3 w-3 border border-amber-600 border-t-transparent rounded-full mr-1" />
                Saving...
              </span>
            )}
            {lastSaved && !isSaving && (
              <span className="text-green-600 text-xs">
                ✓ Saved {lastSaved.toLocaleTimeString()}
              </span>
            )}
            
            {/* Relationship Mode Indicator */}
            {isRelationshipMode && (
              <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 animate-pulse">
                <Link2 className="h-3 w-3 mr-1" />
                Relationship Mode
                {selectedEntityForRelation && (
                  <span className="ml-1">
                    - {schemaData.entities.find(e => e.id === selectedEntityForRelation)?.name} selected
                  </span>
                )}
              </Badge>
            )}
          </div>
          
          <div className="text-xs text-muted-foreground">
            {isRelationshipMode 
              ? 'Click entities to create relationships • ESC to cancel' 
              : 'Drag entities to reposition • Click to edit'
            }
          </div>
        </div>
      </div>

      {/* Enhanced Toolbar */}
      <div className="glass-effect border-b px-6 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={undo}
              disabled={!canUndo}
              className="bg-background/50 hover:bg-background/80"
            >
              <Undo className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={redo}
              disabled={!canRedo}
              className="bg-background/50 hover:bg-background/80"
            >
              <Redo className="h-4 w-4" />
            </Button>
            <div className="h-4 w-px bg-border/50 mx-2" />
            <Button 
              variant="default" 
              size="sm" 
              onClick={handleAddEntity}
              disabled={isRelationshipMode}
              className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Entity
            </Button>
            
            {isRelationshipMode ? (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleCancelRelationshipMode}
                className="bg-red-50 hover:bg-red-100 text-red-600 border-red-200"
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            ) : (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleStartRelationshipMode}
                disabled={schemaData.entities.length < 2}
                className="bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200"
              >
                <Link2 className="mr-2 h-4 w-4" />
                Add Relationship
              </Button>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <CodeGenModal 
              schema={schemaData}
              trigger={
                <Button variant="outline" size="sm" className="bg-background/50 hover:bg-background/80">
                  <Code className="mr-2 h-4 w-4" />
                  Generate Code
                </Button>
              }
            />
            <DiagramExporter 
              canvasRef={canvasRef}
              schemaName={schemaData.name}
            />
            
            {schemaData.relationships.length > 0 && (
              <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                <Link2 className="h-3 w-3 mr-1" />
                {schemaData.relationships.length} relationship{schemaData.relationships.length !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Canvas with Visual Relationships */}
      <div className="flex-1 overflow-hidden min-h-0">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div 
            ref={canvasRef}
            data-export-canvas="true"
            className="relative w-full h-full overflow-auto bg-gradient-to-br from-slate-50/50 to-blue-50/30 dark:from-slate-900/50 dark:to-slate-800/30"
          >
            {schemaData.entities.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center max-w-md">
                  <div className="h-32 w-32 mx-auto mb-6 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center">
                    <Sparkles className="h-16 w-16 text-primary" />
                  </div>
                  <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                    Start Building Your Schema
                  </h2>
                  <p className="text-muted-foreground mb-8 text-lg">
                    Create entities, define relationships, and generate production-ready code
                  </p>
                  <Button onClick={handleAddEntity} size="lg" className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70">
                    <Zap className="mr-2 h-5 w-5" />
                    Create Your First Entity
                  </Button>
                </div>
              </div>
            ) : (
              <SortableContext 
                items={schemaData.entities.map(e => e.id)}
                strategy={rectSortingStrategy}
              >
                <div className="relative p-6 min-h-full">
                  {/* SVG Layer for Relationship Arrows */}
                  <svg
                    ref={svgRef}
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    style={{ zIndex: 1 }}
                  >
                    <defs>
                      <marker
                        id="arrowhead"
                        markerWidth="10"
                        markerHeight="7"
                        refX="9"
                        refY="3.5"
                        orient="auto"
                      >
                        <polygon
                          points="0 0, 10 3.5, 0 7"
                          fill="#6b7280"
                        />
                      </marker>
                    </defs>
                    
                    {/* Render Relationship Arrows */}
                    {schemaData.relationships.map((relationship) => {
                      const fromEntity = schemaData.entities.find(e => e.id === relationship.fromEntity)
                      const toEntity = schemaData.entities.find(e => e.id === relationship.toEntity)
                      
                      if (!fromEntity || !toEntity) return null
                      
                      return (
                        <RelationshipArrow
                          key={relationship.id}
                          relationship={relationship}
                          fromEntity={fromEntity}
                          toEntity={toEntity}
                          onDelete={handleDeleteRelationship}
                        />
                      )
                    })}
                  </svg>

                  {/* Entity Cards */}
                  {schemaData.entities.map((entity) => (
                    <div
                      key={entity.id}
                      className="absolute"
                      style={{
                        left: entity.position.x,
                        top: entity.position.y,
                        zIndex: selectedEntityId === entity.id ? 10 : 2
                      }}
                    >
                      <EntityCard
                        entity={entity}
                        onUpdate={handleEntityUpdate}
                        onDelete={handleEntityDelete}
                        onEntityClick={handleEntityClickForRelation}
                        isSelected={selectedEntityId === entity.id}
                        onSelect={() => setSelectedEntityId(entity.id)}
                        isRelationshipMode={isRelationshipMode}
                        isRelationshipSelected={selectedEntityForRelation === entity.id}
                      />
                    </div>
                  ))}
                </div>
              </SortableContext>
            )}
          </div>

          <DragOverlay>
            {activeEntityId && draggedEntity ? (
              <div className="opacity-80 transform rotate-3 scale-105">
                <EntityCard
                  entity={draggedEntity}
                  onUpdate={() => {}}
                  onDelete={() => {}}
                  isSelected={false}
                  onSelect={() => {}}
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Relationship Selector Modal */}
      <RelationshipSelector
        isOpen={relationshipSelectorOpen}
        onClose={() => {
          setRelationshipSelectorOpen(false)
          setPendingRelationship({ from: null, to: null })
        }}
        fromEntity={pendingRelationship.from}
        toEntity={pendingRelationship.to}
        onCreateRelationship={handleCreateRelationship}
      />

      {/* Floating Action Button */}
      <button
        onClick={handleAddEntity}
        className="floating-action"
        title="Add Entity"
        disabled={isRelationshipMode}
      >
        <Plus className="h-6 w-6" />
      </button>
    </div>
  )
}
