'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { 
  Database, 
  Plus, 
  Share, 
  Download, 
  Upload, 
  Moon,
  Sun,
  Clock,
  Zap,
  Settings,
  Users
} from 'lucide-react'
import { useTheme } from 'next-themes'

interface NavbarProps {
  onNewSchema?: () => void
  onShare?: () => void
  onExport?: () => void
  onImport?: () => void
  currentSchemaName?: string
  lastSaved?: Date | null
  isSaving?: boolean
}

export function Navbar({ 
  onNewSchema, 
  onShare, 
  onExport, 
  onImport, 
  currentSchemaName,
  lastSaved,
  isSaving
}: NavbarProps) {
  const { theme, setTheme } = useTheme()

  return (
    <nav className="glass-effect sticky top-0 z-40 w-full border-b">
      <div className="flex h-16 items-center px-6">
        {/* Logo and Brand */}
        <div className="flex items-center space-x-4">
          <Link href="/" className="flex items-center space-x-3">
            <div className="relative">
              <div className="h-10 w-10 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-lg">
                <Database className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="absolute -top-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-background animate-pulse" />
            </div>
            <div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                Schema Builder
              </span>
              <div className="text-xs text-muted-foreground">Visual Database Designer</div>
            </div>
          </Link>
          
          {currentSchemaName && (
            <>
              <div className="h-8 w-px bg-border/50" />
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                  <Database className="h-3 w-3 mr-1" />
                  {currentSchemaName}
                </Badge>
              </div>
            </>
          )}
        </div>

        {/* Status Indicator */}
        <div className="ml-6 flex items-center space-x-3">
          {isSaving ? (
            <div className="flex items-center space-x-2 text-xs text-amber-600 dark:text-amber-400">
              <div className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
              <span className="font-medium">Saving...</span>
            </div>
          ) : lastSaved ? (
            <div className="flex items-center space-x-2 text-xs text-green-600 dark:text-green-400">
              <Clock className="h-3 w-3" />
              <span>Saved {lastSaved.toLocaleTimeString()}</span>
            </div>
          ) : null}
        </div>

        {/* Actions */}
        <div className="ml-auto flex items-center space-x-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onNewSchema}
            className="bg-background/50 hover:bg-background/80 border-primary/20 hover:border-primary/40"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Schema
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="bg-background/50 hover:bg-background/80">
                <Share className="mr-2 h-4 w-4" />
                Collaborate
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={onShare}>
                <Users className="mr-2 h-4 w-4" />
                Share Schema
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onExport}>
                <Download className="mr-2 h-4 w-4" />
                Export JSON
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onImport}>
                <Upload className="mr-2 h-4 w-4" />
                Import JSON
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="bg-background/50 hover:bg-background/80"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>
        </div>
      </div>
    </nav>
  )
}
