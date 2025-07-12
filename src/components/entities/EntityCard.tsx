'use client'

import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  GripVertical, 
  Plus, 
  Edit, 
  Trash2, 
  MoreVertical,
  Key,
  CheckCircle,
  Database,
  Link2,
  Circle
} from 'lucide-react'

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

interface EntityCardProps {
  entity: Entity
  onUpdate: (entity: Entity) => void
  onDelete: (entityId: string) => void
  onEntityClick?: (entityId: string) => void
  isSelected?: boolean
  onSelect?: () => void
  isRelationshipMode?: boolean
  isRelationshipSelected?: boolean
}

const FIELD_TYPES = [
  { value: 'string', label: 'String', icon: '📝' },
  { value: 'number', label: 'Number', icon: '🔢' },
  { value: 'boolean', label: 'Boolean', icon: '✅' },
  { value: 'date', label: 'Date', icon: '📅' },
  { value: 'email', label: 'Email', icon: '📧' },
  { value: 'url', label: 'URL', icon: '🔗' },
  { value: 'text', label: 'Text', icon: '📄' },
  { value: 'json', label: 'JSON', icon: '🗂️' }
]

export function EntityCard({ 
  entity, 
  onUpdate, 
  onDelete, 
  onEntityClick,
  isSelected, 
  onSelect,
  isRelationshipMode = false,
  isRelationshipSelected = false
}: EntityCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedName, setEditedName] = useState(entity.name)
  const [isExpanded, setIsExpanded] = useState(false)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: entity.id,
    disabled: isRelationshipMode
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1,
  }

  const handleNameSave = () => {
    if (editedName.trim() !== entity.name) {
      onUpdate({ ...entity, name: editedName.trim() })
    }
    setIsEditing(false)
  }

  const handleAddField = () => {
    const newField: Field = {
      id: `field_${Date.now()}`,
      name: 'newField',
      type: 'string',
      isRequired: false,
    }
    onUpdate({
      ...entity,
      fields: [...entity.fields, newField]
    })
    setIsExpanded(true)
  }

  const handleFieldUpdate = (fieldId: string, updates: Partial<Field>) => {
    const updatedFields = entity.fields.map(field =>
      field.id === fieldId ? { ...field, ...updates } : field
    )
    onUpdate({ ...entity, fields: updatedFields })
  }

  const handleFieldDelete = (fieldId: string) => {
    const updatedFields = entity.fields.filter(field => field.id !== fieldId)
    onUpdate({ ...entity, fields: updatedFields })
  }

  const handleCardClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isRelationshipMode && onEntityClick) {
      onEntityClick(entity.id)
    } else if (onSelect) {
      onSelect()
    }
  }

  // Show only first 3 fields when collapsed
  const visibleFields = isExpanded ? entity.fields : entity.fields.slice(0, 3)
  const hasMoreFields = entity.fields.length > 3

  return (
    <Card
      ref={setNodeRef}
      style={style}
      data-entity={entity.id}
      className={`w-64 cursor-default select-none transition-all duration-300 ${
        isSelected ? 'ring-2 ring-primary shadow-xl' : 'hover:shadow-lg'
      } ${isDragging ? 'shadow-2xl scale-105 rotate-2' : ''} ${
        isRelationshipMode ? 'cursor-pointer hover:ring-2 hover:ring-blue-400' : ''
      } ${
        isRelationshipSelected ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950' : 'bg-white dark:bg-slate-800'
      }`}
      onClick={handleCardClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {!isRelationshipMode && (
              <div
                {...attributes}
                {...listeners}
                className="cursor-grab hover:cursor-grabbing p-1 rounded hover:bg-muted/50 transition-colors"
              >
                <GripVertical className="h-3 w-3 text-muted-foreground" />
              </div>
            )}
            
            <div className="flex items-center space-x-2">
              <div className={`h-6 w-6 rounded-md flex items-center justify-center ${
                isRelationshipSelected 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gradient-to-br from-primary/20 to-primary/10'
              }`}>
                {isRelationshipMode ? (
                  <Link2 className="h-3 w-3" />
                ) : (
                  <Database className="h-3 w-3 text-primary" />
                )}
              </div>
              
              {isEditing ? (
                <Input
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  onBlur={handleNameSave}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleNameSave()
                    if (e.key === 'Escape') {
                      setEditedName(entity.name)
                      setIsEditing(false)
                    }
                  }}
                  className="h-6 text-sm font-semibold bg-transparent border-none p-0 focus-visible:ring-1"
                  autoFocus
                />
              ) : (
                <h3 
                  className="text-sm font-semibold cursor-pointer hover:text-primary transition-colors truncate max-w-32"
                  onClick={(e) => {
                    e.stopPropagation()
                    if (!isRelationshipMode) setIsEditing(true)
                  }}
                  title={entity.name}
                >
                  {entity.name}
                </h3>
              )}
            </div>
          </div>

          {!isRelationshipMode && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-muted/50">
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={() => setIsEditing(true)}>
                  <Edit className="mr-2 h-3 w-3" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleAddField}>
                  <Plus className="mr-2 h-3 w-3" />
                  Add Field
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onDelete(entity.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-3 w-3" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{entity.fields.length} field{entity.fields.length !== 1 ? 's' : ''}</span>
          {isRelationshipMode ? (
            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-600 border-blue-200">
              <Circle className="h-2 w-2 mr-1 fill-current" />
              {isRelationshipSelected ? 'Selected' : 'Click to select'}
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs">
              Entity
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0 pb-3">
        <div className="space-y-2">
          {visibleFields.map((field) => (
            <CompactFieldRow
              key={field.id}
              field={field}
              onUpdate={(updates) => handleFieldUpdate(field.id, updates)}
              onDelete={() => handleFieldDelete(field.id)}
              isReadOnly={isRelationshipMode}
            />
          ))}
          
          {hasMoreFields && !isExpanded && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                setIsExpanded(true)
              }}
              className="w-full h-6 text-xs text-muted-foreground hover:text-primary"
            >
              +{entity.fields.length - 3} more fields
            </Button>
          )}
          
          {isExpanded && hasMoreFields && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                setIsExpanded(false)
              }}
              className="w-full h-6 text-xs text-muted-foreground hover:text-primary"
            >
              Show less
            </Button>
          )}
          
          {!isRelationshipMode && (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                handleAddField()
              }}
              className="w-full h-7 mt-2 bg-gradient-to-r from-primary/5 to-primary/10 hover:from-primary/10 hover:to-primary/20 border-primary/20 hover:border-primary/40"
            >
              <Plus className="mr-1 h-3 w-3" />
              Add Field
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

interface CompactFieldRowProps {
  field: Field
  onUpdate: (updates: Partial<Field>) => void
  onDelete: () => void
  isReadOnly?: boolean
}

function CompactFieldRow({ field, onUpdate, onDelete, isReadOnly = false }: CompactFieldRowProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedName, setEditedName] = useState(field.name)

  const handleNameSave = () => {
    if (editedName.trim() !== field.name) {
      onUpdate({ name: editedName.trim() })
    }
    setIsEditing(false)
  }

  const fieldType = FIELD_TYPES.find(t => t.value === field.type)

  return (
    <div className="flex items-center space-x-2 p-2 rounded border bg-gradient-to-r from-background to-muted/20 hover:from-muted/30 hover:to-muted/40 transition-all duration-200">
      <div className="flex items-center space-x-1">
        {field.isPrimary && (
          <div className="h-1.5 w-1.5 rounded-full bg-yellow-500" title="Primary Key" />
        )}
        {field.isRequired && (
          <div className="h-1.5 w-1.5 rounded-full bg-green-500" title="Required" />
        )}
      </div>

      {isEditing && !isReadOnly ? (
        <Input
          value={editedName}
          onChange={(e) => setEditedName(e.target.value)}
          onBlur={handleNameSave}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleNameSave()
            if (e.key === 'Escape') {
              setEditedName(field.name)
              setIsEditing(false)
            }
          }}
          className="h-5 text-xs flex-1 bg-transparent border-none p-0 focus-visible:ring-1"
          autoFocus
        />
      ) : (
        <span 
          className={`text-xs font-medium flex-1 truncate ${!isReadOnly ? 'cursor-pointer hover:text-primary' : ''} transition-colors`}
          onClick={() => !isReadOnly && setIsEditing(true)}
          title={field.name}
        >
          {field.name}
        </span>
      )}

      <Select
        value={field.type}
        onValueChange={(value) => !isReadOnly && onUpdate({ type: value })}
        disabled={isReadOnly}
      >
        <SelectTrigger className="h-5 w-16 text-xs border-none bg-muted/50">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {FIELD_TYPES.map((type) => (
            <SelectItem key={type.value} value={type.value} className="text-xs">
              <span className="flex items-center space-x-1">
                <span className="text-xs">{type.icon}</span>
                <span>{type.label}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {!isReadOnly && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-5 w-5 p-0 hover:bg-muted/50">
              <MoreVertical className="h-2.5 w-2.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            <DropdownMenuItem onClick={() => setIsEditing(true)}>
              <Edit className="mr-2 h-3 w-3" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onUpdate({ isPrimary: !field.isPrimary })}
            >
              <Key className="mr-2 h-3 w-3" />
              {field.isPrimary ? 'Remove Primary' : 'Set Primary'}
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onUpdate({ isRequired: !field.isRequired })}
            >
              <CheckCircle className="mr-2 h-3 w-3" />
              {field.isRequired ? 'Make Optional' : 'Make Required'}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
              <Trash2 className="mr-2 h-3 w-3" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}
