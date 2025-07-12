'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Link2, Trash2, ArrowRight } from 'lucide-react'

interface Relationship {
  id: string
  fromEntity: string
  toEntity: string
  type: 'one-to-one' | 'one-to-many' | 'many-to-many'
}

interface Entity {
  id: string
  name: string
}

interface RelationshipManagerProps {
  entities: Entity[]
  relationships: Relationship[]
  onCreateRelationship: (relationship: Omit<Relationship, 'id'>) => void
  onDeleteRelationship: (relationshipId: string) => void
  isOpen: boolean
  onClose: () => void
  fromEntityId?: string
  toEntityId?: string
}

const RELATIONSHIP_TYPES = [
  { value: 'one-to-one', label: 'One to One', icon: '1:1' },
  { value: 'one-to-many', label: 'One to Many', icon: '1:N' },
  { value: 'many-to-many', label: 'Many to Many', icon: 'N:M' },
]

export function RelationshipManager({
  entities,
  relationships,
  onCreateRelationship,
  onDeleteRelationship,
  isOpen,
  onClose,
  fromEntityId,
  toEntityId
}: RelationshipManagerProps) {
  const [selectedFromEntity, setSelectedFromEntity] = useState(fromEntityId || '')
  const [selectedToEntity, setSelectedToEntity] = useState(toEntityId || '')
  const [selectedType, setSelectedType] = useState<string>('one-to-many')

  const handleCreateRelationship = () => {
    if (!selectedFromEntity || !selectedToEntity || selectedFromEntity === selectedToEntity) {
      return
    }

    // Check if relationship already exists
    const existingRelationship = relationships.find(rel => 
      (rel.fromEntity === selectedFromEntity && rel.toEntity === selectedToEntity) ||
      (rel.fromEntity === selectedToEntity && rel.toEntity === selectedFromEntity)
    )

    if (existingRelationship) {
      return
    }

    onCreateRelationship({
      fromEntity: selectedFromEntity,
      toEntity: selectedToEntity,
      type: selectedType as 'one-to-one' | 'one-to-many' | 'many-to-many'
    })

    // Reset form
    setSelectedFromEntity('')
    setSelectedToEntity('')
    setSelectedType('one-to-many')
    onClose()
  }

  const getEntityName = (entityId: string) => {
    return entities.find(e => e.id === entityId)?.name || 'Unknown'
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Link2 className="h-5 w-5" />
            <span>Manage Relationships</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Create New Relationship */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Create New Relationship</h3>
            
            <div className="grid grid-cols-3 gap-4 items-end">
              <div>
                <label className="text-xs font-medium mb-2 block">From Entity</label>
                <Select value={selectedFromEntity} onValueChange={setSelectedFromEntity}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select entity" />
                  </SelectTrigger>
                  <SelectContent>
                    {entities.map((entity) => (
                      <SelectItem key={entity.id} value={entity.id}>
                        {entity.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-medium mb-2 block">Relationship Type</label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RELATIONSHIP_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <span className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-xs">
                            {type.icon}
                          </Badge>
                          <span>{type.label}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-medium mb-2 block">To Entity</label>
                <Select value={selectedToEntity} onValueChange={setSelectedToEntity}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select entity" />
                  </SelectTrigger>
                  <SelectContent>
                    {entities.map((entity) => (
                      <SelectItem key={entity.id} value={entity.id}>
                        {entity.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button 
              onClick={handleCreateRelationship}
              disabled={!selectedFromEntity || !selectedToEntity || selectedFromEntity === selectedToEntity}
              className="w-full"
            >
              <Link2 className="mr-2 h-4 w-4" />
              Create Relationship
            </Button>
          </div>

          {/* Existing Relationships */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Existing Relationships ({relationships.length})</h3>
            
            {relationships.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Link2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No relationships created yet</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {relationships.map((relationship) => (
                  <div
                    key={relationship.id}
                    className="flex items-center justify-between p-3 border rounded-lg bg-muted/20"
                  >
                    <div className="flex items-center space-x-3">
                      <Badge variant="outline" className="text-xs">
                        {RELATIONSHIP_TYPES.find(t => t.value === relationship.type)?.icon}
                      </Badge>
                      <span className="text-sm font-medium">
                        {getEntityName(relationship.fromEntity)}
                      </span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {getEntityName(relationship.toEntity)}
                      </span>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteRelationship(relationship.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
