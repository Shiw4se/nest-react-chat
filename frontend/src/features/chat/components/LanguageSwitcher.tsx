import React from 'react';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES } from '../../../constants/languages';

export const LanguageSwitcher: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { t, i18n } = useTranslation();
  const current = SUPPORTED_LANGUAGES.find((l) => i18n.language.startsWith(l)) ?? 'en';

  return (
    <label className={`relative inline-flex items-center ${className}`}>
      <span className="sr-only">{t('common.language', 'Language')}</span>
      <select
        value={current}
        onChange={(e) => i18n.changeLanguage(e.target.value)}
        className="appearance-none bg-slate-900/70 border border-slate-700/60 text-slate-300 text-xs font-bold uppercase rounded-lg pl-2.5 pr-6 h-8 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/70"
      >
        {SUPPORTED_LANGUAGES.map((lang) => (
          <option key={lang} value={lang}>
            {lang}
          </option>
        ))}
      </select>
      <span
        className="pointer-events-none absolute right-2 text-slate-500 text-[10px]"
        aria-hidden="true"
      >
        ▼
      </span>
    </label>
  );
};
