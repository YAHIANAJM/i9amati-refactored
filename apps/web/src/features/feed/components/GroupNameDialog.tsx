import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface GroupNameDialogProps {
  open:     boolean
  title:    string
  initial?: string
  onClose:  () => void
  onSave:   (name: string) => void
}

export function GroupNameDialog({ open, title, initial, onClose, onSave }: GroupNameDialogProps) {
  const { t } = useTranslation()
  const [name, setName] = useState(initial ?? '')

  function handle() {
    if (!name.trim()) return
    onSave(name.trim())
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent className="max-w-sm p-6">
        <DialogTitle className="text-base font-semibold mb-4">{title}</DialogTitle>
        <div className="space-y-3">
          <input
            autoFocus
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handle()}
            placeholder={t('feed.groupName')}
            className="w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring bg-muted/30"
          />
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" size="sm" onClick={onClose}>{t('feed.cancel')}</Button>
            <Button size="sm" disabled={!name.trim()} onClick={handle}>{t('feed.save')}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
