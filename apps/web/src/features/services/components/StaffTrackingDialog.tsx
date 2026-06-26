import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { Play, Square, User, History, Plus } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { toastApiError, toastCreated, toastUpdated } from '@/components/toast'
import { servicesApi, type ApiService } from '@/lib/services.api'
import { CreateStaffDialog } from './CreateStaffDialog'

interface StaffTrackingDialogProps {
  open: boolean
  service: ApiService | null
  onClose: () => void
}

export function StaffTrackingDialog({ open, service, onClose }: StaffTrackingDialogProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  
  const [selectedStaffId, setSelectedStaffId] = useState<string>('')
  const [showCreateStaff, setShowCreateStaff] = useState(false)

  const { data: sessions = [], isLoading: loadingSessions } = useQuery({
    queryKey: ['services', service?.id, 'sessions'],
    queryFn: () => servicesApi.getSessions(service!.id),
    enabled: open && !!service,
  })

  const { data: staffList = [] } = useQuery({
    queryKey: ['services', 'staff'],
    queryFn: servicesApi.getStaff,
    enabled: open,
  })

  const checkIn = useMutation({
    mutationFn: (profileId: string) => servicesApi.checkIn(service!.id, profileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services', service?.id, 'sessions'] })
      toastCreated(t('services.staffCheckedIn'))
      setSelectedStaffId('')
    },
    onError: toastApiError,
  })

  const checkOut = useMutation({
    mutationFn: (sessionId: string) => servicesApi.checkOut(service!.id, sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services', service?.id, 'sessions'] })
      toastUpdated(t('services.staffCheckedOut'))
    },
    onError: toastApiError,
  })

  const activeSessions = useMemo(() => sessions.filter(s => !s.check_out_at), [sessions])
  const pastSessions = useMemo(() => sessions.filter(s => !!s.check_out_at), [sessions])

  function handleCheckIn() {
    if (!selectedStaffId) return
    checkIn.mutate(selectedStaffId)
  }

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-md max-h-[85vh] flex flex-col p-6">
        <div className="mb-4">
          <DialogTitle className="text-xl font-bold">{t('services.staffTracking')}</DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {service?.name} - {t('services.trackStaffDesc')}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto space-y-6 pr-2 mt-2">
          {/* Check In Action */}
          <div className="flex items-end gap-2 bg-muted/30 p-3 rounded-lg border border-border/50">
            <div className="flex-1 space-y-2">
              <label className="text-xs font-medium">{t('services.selectStaff')}</label>
              <div className="flex items-center gap-2">
                <select
                  value={selectedStaffId}
                  onChange={(e) => setSelectedStaffId(e.target.value)}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="" disabled>{t('services.selectStaffPlaceholder')}</option>
                  {staffList.map(staff => (
                    <option key={staff.id} value={staff.id}>
                      {staff.firstName} {staff.lastName}
                    </option>
                  ))}
                </select>
                <Button 
                  size="icon" 
                  variant="outline" 
                  className="h-10 w-10 shrink-0" 
                  onClick={() => setShowCreateStaff(true)}
                  title={t('services.createStaff')}
                >
                  <Plus size={16} />
                </Button>
              </div>
            </div>
            <Button
              size="sm"
              className="gap-1.5 shrink-0 h-9"
              disabled={!selectedStaffId || checkIn.isPending}
              onClick={handleCheckIn}
            >
              <Play size={13} /> {t('services.checkIn')}
            </Button>
          </div>

          {/* Active Sessions */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold flex items-center gap-1.5 text-primary">
              <span className="relative flex h-2 w-2">
                {activeSessions.length > 0 && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>}
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              {t('services.activeSessions')}
            </h4>
            
            {loadingSessions ? (
              <p className="text-sm text-muted-foreground">{t('services.loading')}</p>
            ) : activeSessions.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('services.noActiveSessions')}</p>
            ) : (
              <div className="space-y-2">
                {activeSessions.map(session => (
                  <div key={session.id} className="flex items-center justify-between p-3 rounded-lg border border-primary/20 bg-primary/5">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        {session.profile.image ? (
                          <img src={session.profile.image} alt="" className="h-full w-full rounded-full object-cover" />
                        ) : (
                          <User size={14} className="text-primary" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium leading-none">{session.profile.firstName} {session.profile.lastName}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {t('services.in')}: {format(new Date(session.check_in_at), 'MMM d, HH:mm')}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 h-8 text-xs border-primary/20 hover:bg-primary hover:text-primary-foreground"
                      disabled={checkOut.isPending}
                      onClick={() => checkOut.mutate(session.id)}
                    >
                      <Square size={12} className="fill-current" /> {t('services.checkOut')}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Past Sessions */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold flex items-center gap-1.5 text-muted-foreground">
              <History size={14} /> {t('services.pastSessions')}
            </h4>
            
            {!loadingSessions && pastSessions.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('services.noPastSessions')}</p>
            ) : (
              <div className="space-y-2">
                {pastSessions.map(session => (
                  <div key={session.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                        {session.profile.image ? (
                          <img src={session.profile.image} alt="" className="h-full w-full rounded-full object-cover opacity-70" />
                        ) : (
                          <User size={14} className="text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium leading-none">{session.profile.firstName} {session.profile.lastName}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <span>{format(new Date(session.check_in_at), 'MMM d, HH:mm')}</span>
                          <span>→</span>
                          <span>{session.check_out_at ? format(new Date(session.check_out_at), 'HH:mm') : ''}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
      
      {showCreateStaff && (
        <CreateStaffDialog 
          open={showCreateStaff} 
          onClose={() => setShowCreateStaff(false)} 
        />
      )}
    </Dialog>
  )
}
