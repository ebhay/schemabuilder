'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Code, Copy, Download, Loader2 } from 'lucide-react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import toast from 'react-hot-toast'

interface CodeGenModalProps {
  schema: any
  trigger?: React.ReactNode
}

const DATABASE_TYPES = [
  { value: 'mongodb', label: 'MongoDB (Mongoose)', language: 'javascript' },
  { value: 'sql', label: 'SQL (PostgreSQL)', language: 'sql' },
  { value: 'supabase', label: 'Supabase', language: 'sql' },
  { value: 'prisma', label: 'Prisma', language: 'javascript' },
]

export function CodeGenModal({ schema, trigger }: CodeGenModalProps) {
  const [open, setOpen] = useState(false)
  const [databaseType, setDatabaseType] = useState('mongodb')
  const [customPrompt, setCustomPrompt] = useState('')
  const [generatedCode, setGeneratedCode] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerate = async () => {
    if (!schema || schema.entities.length === 0) {
      toast.error('Please add at least one entity to generate code')
      return
    }

    setIsGenerating(true)
    try {
      const response = await fetch('/api/generate-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schema,
          databaseType,
          customPrompt: customPrompt || undefined
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate code')
      }

      const result = await response.json()
      setGeneratedCode(result.code)
      toast.success('Code generated successfully!')
    } catch (error) {
      console.error('Code generation failed:', error)
      toast.error('Failed to generate code')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedCode)
    toast.success('Code copied to clipboard!')
  }

  const handleDownload = () => {
    const selectedDb = DATABASE_TYPES.find(db => db.value === databaseType)
    const extension = selectedDb?.language === 'sql' ? 'sql' : 'js'
    const filename = `schema-${databaseType}.${extension}`
    
    const blob = new Blob([generatedCode], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
    toast.success('Code downloaded!')
  }

  const selectedDb = DATABASE_TYPES.find(db => db.value === databaseType)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <Code className="mr-2 h-4 w-4" />
            Generate Code
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>AI Code Generation</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden flex flex-col space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Database Type</label>
              <Select value={databaseType} onValueChange={setDatabaseType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DATABASE_TYPES.map((db) => (
                    <SelectItem key={db.value} value={db.value}>
                      {db.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Actions</label>
              <div className="flex space-x-2">
                <Button 
                  onClick={handleGenerate} 
                  disabled={isGenerating}
                  className="flex-1"
                >
                  {isGenerating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Code className="mr-2 h-4 w-4" />
                  )}
                  Generate
                </Button>
                {generatedCode && (
                  <>
                    <Button variant="outline" onClick={handleCopy}>
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" onClick={handleDownload}>
                      <Download className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Custom Prompt (Optional)</label>
            <Textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Add any specific requirements or modifications..."
              className="h-20"
            />
          </div>

          {generatedCode && (
            <div className="flex-1 overflow-hidden">
              <label className="text-sm font-medium mb-2 block">Generated Code</label>
              <div className="h-full overflow-auto border rounded-md">
                <SyntaxHighlighter
                  language={selectedDb?.language || 'javascript'}
                  style={oneDark}
                  customStyle={{
                    margin: 0,
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem'
                  }}
                >
                  {generatedCode}
                </SyntaxHighlighter>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
