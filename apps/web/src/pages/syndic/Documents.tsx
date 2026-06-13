import { TopBar } from '@/components/layout/TopBar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { FileText, Upload, Download, Folder, Search } from 'lucide-react'
import { mockDocuments } from '@/data/mock/documents'
import { formatDate } from '@/lib/utils'
import { useState } from 'react'

const fileIconColors: Record<string, string> = {
  PDF: 'text-red-500 bg-red-50',
  XLSX: 'text-emerald-600 bg-emerald-50',
  DOCX: 'text-blue-600 bg-blue-50',
}

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function Documents() {
  const [search, setSearch] = useState('')
  const filtered = mockDocuments.filter(d =>
    search === '' || d.name.toLowerCase().includes(search.toLowerCase()) || d.category.toLowerCase().includes(search.toLowerCase())
  )

  const categories = [...new Set(mockDocuments.map(d => d.category))]

  return (
    <div className="flex flex-col min-h-full">
      <TopBar
        title="Documents"
        subtitle="Tous les documents de votre résidence"
        actions={
          <Button size="sm" className="gap-1.5 text-xs">
            <Upload size={13} /> Uploader
          </Button>
        }
      />

      <div className="flex-1 p-6 space-y-5 animate-fade-in">
        {/* Category chips */}
        <div className="flex flex-wrap gap-2">
          {categories.map(cat => (
            <button key={cat} className="px-3 py-1.5 text-xs rounded-full border bg-background hover:bg-muted transition-colors font-medium">
              <Folder size={11} className="inline mr-1.5 text-muted-foreground" />
              {cat}
            </button>
          ))}
        </div>

        <div className="relative flex items-center w-64">
          <Search size={13} className="absolute left-3 text-muted-foreground pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un document..."
            className="h-8 w-full rounded-md border bg-background pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map(doc => {
            const iconCls = fileIconColors[doc.type] || 'text-gray-500 bg-gray-50'
            return (
              <Card key={doc.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4 flex items-start gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg text-xs font-bold shrink-0 ${iconCls}`}>
                    {doc.type}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{doc.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-muted-foreground">{formatSize(doc.size)}</span>
                      <span className="text-[11px] text-muted-foreground">·</span>
                      <span className="text-[11px] text-muted-foreground">{formatDate(doc.uploadedAt)}</span>
                    </div>
                    <Badge variant="secondary" className="mt-1.5 text-[10px] py-0">{doc.category}</Badge>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                    <Download size={13} />
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <FileText size={40} className="mb-3 opacity-30" />
            <p className="text-sm">Aucun document trouvé</p>
          </div>
        )}
      </div>
    </div>
  )
}
