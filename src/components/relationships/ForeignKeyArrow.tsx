'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Trash2, Key } from 'lucide-react'

interface ForeignKeyArrowProps {
  foreignKey: ForeignKeyConstraint
  fromEntity: Entity
  toEntity: Entity
  fromField: Field
  toField: Field
  onDelete: (id: string) => void
}

export function ForeignKeyArrow({
  foreignKey,
  fromEntity,
  toEntity,
  fromField,
  toField,
  onDelete
}: ForeignKeyArrowProps) {
  // Calculate positions based on field positions within entities
  const fromFieldIndex = fromEntity.fields.findIndex(f => f.id === fromField.id)
  const toFieldIndex = toEntity.fields.findIndex(f => f.id === toField.id)
  
  const fromCenter = {
    x: fromEntity.position.x + 128,
    y: fromEntity.position.y + 60 + (fromFieldIndex * 25) // Offset by field position
  }
  
  const toCenter = {
    x: toEntity.position.x + 128,
    y: toEntity.position.y + 60 + (toFieldIndex * 25)
  }

  // Calculate arrow path with field-specific positioning
  const dx = toCenter.x - fromCenter.x
  const dy = toCenter.y - fromCenter.y
  const distance = Math.sqrt(dx * dx + dy * dy)
  
  const unitX = dx / distance
  const unitY = dy / distance
  
  // Connect to field edges instead of entity centers
  const offset = 130 // Connect to entity edge
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

  const midX = (startX + endX) / 2
  const midY = (startY + endY) / 2

  const getRelationshipColor = (type: string) => {
    switch (type) {
      case 'one-to-one': return '#10b981'
      case 'one-to-many': return '#3b82f6'
      case 'many-to-many': return '#8b5cf6'
      default: return '#6b7280'
    }
  }

  const getCardinality = (type: string) => {
    switch (type) {
      case 'one-to-one': return '1:1'
      case 'one-to-many': return '1:N'
      case 'many-to-many': return 'N:M'
      default: return '?'
    }
  }

  const color = getRelationshipColor(foreignKey.relationshipType)

  return (
    <g className="foreign-key-arrow">
      {/* Main line with dashed style for foreign keys */}
      <line
        x1={startX}
        y1={startY}
        x2={endX}
        y2={endY}
        stroke={color}
        strokeWidth="2"
        strokeDasharray="5,5"
        markerEnd="url(#fk-arrowhead)"
        className="transition-all duration-200 hover:stroke-width-3"
      />
      
      {/* Arrow head */}
      <polygon
        points={`${endX},${endY} ${arrowX1},${arrowY1} ${arrowX2},${arrowY2}`}
        fill={color}
      />
      
      {/* Foreign key indicator */}
      <g transform={`translate(${midX}, ${midY})`}>
        <rect
          x="-25"
          y="-15"
          width="50"
          height="30"
          rx="15"
          fill="white"
          stroke={color}
          strokeWidth="2"
          className="drop-shadow-sm"
        />
        <text
          x="0"
          y="-5"
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="8"
          fontWeight="600"
          fill={color}
        >
          FK
        </text>
        <text
          x="0"
          y="5"
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="8"
          fontWeight="600"
          fill={color}
        >
          {getCardinality(foreignKey.relationshipType)}
        </text>
      </g>
      
      {/* Field names tooltip */}
      <g 
        transform={`translate(${midX}, ${midY - 40})`}
        className="opacity-0 hover:opacity-100 transition-opacity"
      >
        <rect
          x="-60"
          y="-20"
          width="120"
          height="35"
          rx="5"
          fill="rgba(0,0,0,0.8)"
          className="drop-shadow-lg"
        />
        <text
          x="0"
          y="-8"
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="10"
          fill="white"
          fontFamily="monospace"
        >
          {fromEntity.tableName}.{fromField.name}
        </text>
        <text
          x="0"
          y="5"
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="10"
          fill="white"
          fontFamily="monospace"
        >
          → {toEntity.tableName}.{toField.name}
        </text>
      </g>
      
      {/* Delete button */}
      <g 
        transform={`translate(${midX + 35}, ${midY - 35})`}
        className="cursor-pointer opacity-0 hover:opacity-100 transition-opacity"
        onClick={() => onDelete(foreignKey.id)}
      >
        <circle
          cx="0"
          cy="0"
          r="12"
          fill="#ef4444"
          className="hover:fill-red-600"
        />
        <text
          x="0"
          y="0"
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="14"
          fill="white"
          fontWeight="bold"
        >
          ×
        </text>
      </g>
    </g>
  )
}
