import { TopBar } from "@/components/layout/TopBar";
import { ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

interface TopBarProps {
    service?: {
        name: string;
    };
}

export function Topbar({ service }: TopBarProps) {

    const { t } = useTranslation()
    const navigate = useNavigate()

    return (<TopBar
        title={
            <div className="flex items-center gap-1.5 flex-wrap">
                <button
                    onClick={() => navigate('/syndic/services')}
                    className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
                >
                    {t('services.pageTitle')}
                </button>
                <ChevronRight size={13} className="text-muted-foreground shrink-0" />
                <span className="text-muted-foreground text-sm">{service?.name ?? '…'}</span>
                <ChevronRight size={13} className="text-muted-foreground shrink-0" />
                <span className="text-foreground text-sm font-semibold">{t('services.staffTracking')}</span>
            </div>
        }
        subtitle={t('services.trackStaffDesc')}
        hideSearch
    />
    )
}