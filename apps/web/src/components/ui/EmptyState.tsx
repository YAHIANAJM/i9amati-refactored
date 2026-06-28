import { DotLottieReact } from '@lottiefiles/dotlottie-react'

interface EmptyStateProps {
  title?: string
  description?: string
}

const LOTTIE_SRC = '/animations/404 error not found.lottie'

export function EmptyState({
  title = 'Aucun résultat trouvé',
  description = 'Aucun élément ne correspond aux filtres que vous avez sélectionnés. Essayez d\'ajuster ou de réinitialiser vos critères de recherche.',
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center pt-2 pb-8 px-6 select-none">
      <DotLottieReact
        src={LOTTIE_SRC}
        loop
        autoplay
        style={{ width: 420, height: 420, marginBottom: -70 }}
      />
      <p className="text-base font-bold text-foreground text-center">{title}</p>
      <p className="mt-1.5 text-sm text-muted-foreground text-center max-w-xs leading-relaxed">
        {description}
      </p>
    </div>
  )
}
