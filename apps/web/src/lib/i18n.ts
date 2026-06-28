import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import ar from '../locales/ar/translation'
import en from '../locales/en/translation'
import fr from '../locales/fr/translation'
import tzm from '../locales/tzm/translation'

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation'
    resources: {
      translation: typeof ar
    }
  }
}

i18n
  .use(initReactI18next)
  .init({
    resources: {
      ar:  { translation: ar  },
      en:  { translation: en  },
      fr:  { translation: fr  },
      tzm: { translation: tzm as any },
    },
    lng: 'ar',
    fallbackLng: 'ar',
    interpolation: {
      escapeValue: false,
    },
  })

export default i18n
