'use client'

import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Download, Camera, FileImage, Printer, Share } from 'lucide-react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
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

interface DiagramExporterProps {
  canvasRef: React.RefObject<HTMLDivElement | null>
  schemaName: string
}

export function DiagramExporter({ 
  canvasRef, 
  schemaName
}: DiagramExporterProps) {
  const [isExporting, setIsExporting] = useState(false)

  const exportAsPNG = async (quality: 'standard' | 'high' | 'print' = 'high') => {
    if (!canvasRef.current) {
      toast.error('Canvas not found')
      return
    }

    // Store original style values to restore later
    const root = document.documentElement
    const originalBg = canvasRef.current.style.background
    const originalVars: Record<string, string> = {}
    // List of CSS variables commonly set to oklch by Tailwind
    const varsToOverride = [
      '--background', '--background-start', '--background-end', '--primary', '--secondary', '--muted', '--border', '--ring', '--input', '--popover', '--card', '--accent', '--destructive', '--foreground', '--primary-foreground', '--secondary-foreground', '--muted-foreground', '--accent-foreground', '--destructive-foreground', '--ring-offset-background', '--ring-inset', '--ring-offset', '--ring-color', '--ring-opacity', '--ring-shadow', '--shadow', '--shadow-lg', '--shadow-md', '--shadow-sm', '--shadow-xl', '--shadow-2xl', '--shadow-inner', '--shadow-outline', '--shadow-solid', '--shadow-none', '--shadow-xs', '--shadow-dark', '--shadow-light', '--shadow-primary', '--shadow-secondary', '--shadow-accent', '--shadow-muted', '--shadow-popover', '--shadow-card', '--shadow-input', '--shadow-border', '--shadow-ring', '--shadow-destructive', '--shadow-foreground', '--shadow-primary-foreground', '--shadow-secondary-foreground', '--shadow-muted-foreground', '--shadow-accent-foreground', '--shadow-destructive-foreground', '--shadow-ring-offset-background', '--shadow-ring-inset', '--shadow-ring-offset', '--shadow-ring-color', '--shadow-ring-opacity', '--shadow-ring-shadow', '--shadow-ring-outline', '--shadow-ring-solid', '--shadow-ring-none', '--shadow-ring-xs', '--shadow-ring-dark', '--shadow-ring-light', '--shadow-ring-primary', '--shadow-ring-secondary', '--shadow-ring-accent', '--shadow-ring-muted', '--shadow-ring-popover', '--shadow-ring-card', '--shadow-ring-input', '--shadow-ring-border', '--shadow-ring-destructive', '--shadow-ring-foreground', '--shadow-ring-primary-foreground', '--shadow-ring-secondary-foreground', '--shadow-ring-muted-foreground', '--shadow-ring-accent-foreground', '--shadow-ring-destructive-foreground', '--shadow-ring-ring-offset-background', '--shadow-ring-ring-inset', '--shadow-ring-ring-offset', '--shadow-ring-ring-color', '--shadow-ring-ring-opacity', '--shadow-ring-ring-shadow', '--shadow-ring-ring-outline', '--shadow-ring-ring-solid', '--shadow-ring-ring-none', '--shadow-ring-ring-xs', '--shadow-ring-ring-dark', '--shadow-ring-ring-light', '--shadow-ring-ring-primary', '--shadow-ring-ring-secondary', '--shadow-ring-ring-accent', '--shadow-ring-ring-muted', '--shadow-ring-ring-popover', '--shadow-ring-ring-card', '--shadow-ring-ring-input', '--shadow-ring-ring-border', '--shadow-ring-ring-destructive', '--shadow-ring-ring-foreground', '--shadow-ring-ring-primary-foreground', '--shadow-ring-ring-secondary-foreground', '--shadow-ring-ring-muted-foreground', '--shadow-ring-ring-accent-foreground', '--shadow-ring-ring-destructive-foreground'
    ]
    varsToOverride.forEach((v) => {
      const val = getComputedStyle(root).getPropertyValue(v)
      if (val && val.includes('oklch')) {
        originalVars[v] = val
        root.style.setProperty(v, '#fff') // fallback to white
      }
    })
    canvasRef.current.style.background = '#fff'

    try {
      setIsExporting(true)
      toast.loading('Generating PNG diagram...', { id: 'export' })
      // Hide UI elements during export
      const elementsToHide = canvasRef.current.querySelectorAll('.floating-action, .delete-button, .hover-only')
      elementsToHide.forEach((el: Element) => (el as HTMLElement).style.display = 'none')
      await new Promise(resolve => setTimeout(resolve, 200))
      // Double-check null
      if (!canvasRef.current) throw new Error('Canvas not found')
      const canvas = await html2canvas(canvasRef.current, {
        useCORS: true,
        allowTaint: true,
        height: Math.max(canvasRef.current.scrollHeight, 600),
        width: Math.max(canvasRef.current.scrollWidth, 800),
        logging: false
      })
      elementsToHide.forEach((el: Element) => (el as HTMLElement).style.display = '')
      if (canvas.width === 0 || canvas.height === 0) {
        throw new Error('Canvas has no content to export')
      }
      const link = document.createElement('a')
      link.download = `${schemaName.replace(/\s+/g, '-').toLowerCase()}-schema-${quality}.png`
      link.href = canvas.toDataURL('image/png', 1.0)
      link.style.display = 'none'
      document.body.appendChild(link)
      link.click()
      setTimeout(() => {
        document.body.removeChild(link)
      }, 100)
      toast.success(`${quality.toUpperCase()} quality diagram exported!`, { id: 'export' })
    } catch (error) {
      console.error('PNG export failed:', error)
      toast.error(`Failed to export PNG: ${error instanceof Error ? error.message : 'Unknown error'}`, { id: 'export' })
    } finally {
      // Restore original styles
      Object.entries(originalVars).forEach(([v, val]) => {
        root.style.setProperty(v, val)
      })
      if (canvasRef.current) canvasRef.current.style.background = originalBg
      setIsExporting(false)
    }
  }

  const exportAsPDF = async () => {
    if (!canvasRef.current) {
      toast.error('Canvas not found')
      return
    }

    try {
      setIsExporting(true)
      toast.loading('Generating PDF diagram...', { id: 'export' })
      
      // Hide UI elements during export
      const elementsToHide = canvasRef.current.querySelectorAll('.floating-action, .delete-button, .hover-only')
      elementsToHide.forEach(el => (el as HTMLElement).style.display = 'none')
      
      // Wait a moment for DOM to update
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const canvas = await html2canvas(canvasRef.current, {
        useCORS: true,
        allowTaint: true,
        logging: true
      })

      // Restore UI elements
      elementsToHide.forEach(el => (el as HTMLElement).style.display = '')
      
      // Check if canvas has content
      if (canvas.width === 0 || canvas.height === 0) {
        throw new Error('Canvas has no content to export')
      }

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'mm',
        format: 'a4'
      })

      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      const imgWidth = canvas.width
      const imgHeight = canvas.height
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight)
      const imgX = (pdfWidth - imgWidth * ratio) / 2
      const imgY = 30

      // Add title
      pdf.setFontSize(16)
      pdf.text(schemaName, pdfWidth / 2, 20, { align: 'center' })
      
      // Add schema statistics
      pdf.setFontSize(10)
      pdf.text(`Generated: ${new Date().toLocaleDateString()}`, 
               pdfWidth / 2, 25, { align: 'center' })

      // Add diagram
      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio)

      pdf.save(`${schemaName.replace(/\s+/g, '-').toLowerCase()}-schema.pdf`)
      toast.success('PDF exported successfully!', { id: 'export' })
    } catch (error) {
      console.error('PDF export failed:', error)
      toast.error(`Failed to export PDF: ${error instanceof Error ? error.message : 'Unknown error'}`, { id: 'export' })
    } finally {
      setIsExporting(false)
    }
  }

  const exportAsSVG = async () => {
    if (!canvasRef.current) {
      toast.error('Canvas not found')
      return
    }

    try {
      setIsExporting(true)
      toast.loading('Generating SVG diagram...', { id: 'export' })
      
      // For now, we'll export as PNG and convert to SVG format
      // This is a simplified approach - for true SVG export, we'd need the schema data
      toast.error('SVG export not available in this version', { id: 'export' })
    } catch (error) {
      console.error('SVG export failed:', error)
      toast.error('Failed to export SVG', { id: 'export' })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          disabled={isExporting}
          className="bg-background/50 hover:bg-background/80"
        >
          {isExporting ? (
            <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
          ) : (
            <Camera className="mr-2 h-4 w-4" />
          )}
          Export Diagram
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => exportAsPNG('standard')}>
          <FileImage className="mr-2 h-4 w-4" />
          PNG (Standard)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => exportAsPNG('high')}>
          <FileImage className="mr-2 h-4 w-4" />
          PNG (High Quality)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => exportAsPNG('print')}>
          <Printer className="mr-2 h-4 w-4" />
          PNG (Print Quality)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportAsPDF}>
          <FileImage className="mr-2 h-4 w-4" />
          PDF Document
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
