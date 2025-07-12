'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Link2, ArrowRight, X } from 'lucide-react'

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

interface RelationshipSelectorProps {
  isOpen: boolean
  onClose: () => void
  fromEntity: Entity | null
  toEntity: Entity | null
  onCreateRelationship: (type: 'one-to-one' | 'one-to-many' | 'many-to-many') => void
}

const RELATIONSHIP_TYPES = [
  { 
    value: 'one-to-one', 
    label: 'One to One', 
    icon: '1:1',
    description: 'Each record in the first entity relates to exactly one record in the second entity',
    example: 'User ↔ Profile'
  },
  { 
    value: 'one-to-many', 
    label: 'One to Many', 
    icon: '1:N',
    description: 'Each record in the first entity can relate to multiple records in the second entity',
    example: 'User → Posts'
  },
  { 
    value: 'many-to-many', 
    label: 'Many to Many', 
    icon: 'N:M',
    description: 'Records in both entities can relate to multiple records in the other entity',
    example: 'Users ↔ Roles'
  },
]

export function RelationshipSelector({
  isOpen,
  onClose,
  fromEntity,
  toEntity,
  onCreateRelationship
}: RelationshipSelectorProps) {
  const [selectedType, setSelectedType] = useState<string>('one-to-many')

  const handleCreateRelationship = () => {
    onCreateRelationship(selectedType as 'one-to-one' | 'one-to-many' | 'many-to-many')
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center space-x-2">
              <Link2 className="h-5 w-5" />
              <span>Create Relationship</span>
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Entity Connection Preview */}
          <div className="flex items-center justify-center space-x-3 p-4 bg-muted/30 rounded-lg">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              {fromEntity?.name || 'Entity A'}
            </Badge>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              {toEntity?.name || 'Entity B'}
            </Badge>
          </div>

          {/* Relationship Type Selection */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Select Relationship Type</h3>
            
            <div className="space-y-2">
              {RELATIONSHIP_TYPES.map((type) => (
                <div
                  key={type.value}
                  className={`p-3 border rounded-lg cursor-pointer transition-all ${
                    selectedType === type.value
                      ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                      : 'border-border hover:border-primary/50 hover:bg-muted/30'
                  }`}
                  onClick={() => setSelectedType(type.value)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          selectedType === type.value 
                            ? 'bg-primary text-primary-foreground border-primary' 
                            : ''
                        }`}
                      >
                        {type.icon}
                      </Badge>
                      <span className="font-medium text-sm">{type.label}</span>
                    </div>
                    {selectedType === type.value && (
                      <div className="h-2 w-2 rounded-full bg-primary" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">
                    {type.description}
                  </p>
                  <p className="text-xs text-primary font-medium">
                    Example: {type.example}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleCreateRelationship} className="flex-1">
              <Link2 className="mr-2 h-4 w-4" />
              Create Relationship
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
