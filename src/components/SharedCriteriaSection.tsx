'use client';

import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import SectionHeading from './SectionHeading';
import SelectField from './SelectField';
import CheckRow from './CheckRow';
import SubMonthRow from './SubMonthRow';
import type { PlanningDates, SharedCriteria } from '@/lib/types';
import { isYm } from '@/lib/types';
import { ENGLISH_VALIDITY_MONTHS, addMonths, monthsBetween, naatiExpiryMonth } from '@/lib/timeline';
import {
  bonusGroups,
  sharedBonusCriteria,
  sharedSelectCriteria,
} from '@/data/pointsCriteria';
import type { SharedBonusField, SharedSelectField } from '@/data/pointsCriteria';

interface SharedCriteriaSectionProps {
  shared: SharedCriteria;
  onPatch: (patch: Partial<SharedCriteria>) => void;
  openSelect: string | null;
  setOpenSelect: (key: string | null) => void;
  /** When true, the age select shows the date-derived bracket and is locked. */
  ageLocked?: boolean;
  dates: PlanningDates;
  onDatesPatch: (patch: Partial<PlanningDates>) => void;
  today: string;
}

const SELECT_FIELDS: SharedSelectField[] = ['age', 'english', 'education', 'partnerStatus'];

function SharedCriteriaSection({
  shared, onPatch, openSelect, setOpenSelect, ageLocked, dates, onDatesPatch, today,
}: SharedCriteriaSectionProps) {
  const { t } = useTranslation();

  const zActive = openSelect?.startsWith('sh:');

  // Future birth or an implied age under 18 both invalidate the derivation
  const birthWarn = isYm(dates.birth)
    ? (dates.birth >= today ? t('tlFutureBirth')
      : monthsBetween(dates.birth, today) < 18 * 12 ? t('tlUnder18') : undefined)
    : undefined;
  const englishNote = isYm(dates.englishTest)
    ? t('tlEnglishExpires', { date: addMonths(dates.englishTest, ENGLISH_VALIDITY_MONTHS) })
    : undefined;
  const naatiNote = shared.communityLanguage && isYm(dates.naatiCert)
    ? t('tlNaatiExpires', { date: naatiExpiryMonth(dates.naatiCert) })
    : undefined;

  return (
    <section
      className="mt-[76px] relative"
      style={{ zIndex: zActive ? 30 : 'auto', animation: 'eoiFadeUp 0.7s ease 0.08s backwards' }}
    >
      <SectionHeading num="01" title={t('sections.shared')} side="SHARED" />
      <p className="mt-3.5 mb-0 text-[12.5px] leading-[1.7] max-w-[46em]" style={{ color: 'var(--muted)' }}>
        {t('sharedNote')}
      </p>

      <div className="grid gap-x-9 gap-y-[30px] mt-[30px]" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(290px, 100%), 1fr))' }}>
        {SELECT_FIELDS.map((field) => {
          const key = `sh:${field}`;
          return (
            <div key={field}>
              <SelectField
                label={t(`fields.${field}`)}
                placeholder={t('placeholder')}
                options={sharedSelectCriteria[field].map((o) => ({
                  value: o.value,
                  label: t(`options.${field}.${o.value || 'none'}`),
                  points: o.points,
                }))}
                value={shared[field]}
                open={openSelect === key}
                onToggle={() => setOpenSelect(openSelect === key ? null : key)}
                onPick={(v) => { onPatch({ [field]: v }); setOpenSelect(null); }}
                fieldBg="surface"
                lockedNote={field === 'age' && ageLocked ? t('tlDerived') : undefined}
              />
              {field === 'age' && (
                <SubMonthRow
                  label={t('tlBirth')}
                  value={dates.birth}
                  onChange={(v) => onDatesPatch({ birth: v })}
                  placeholder={t('tlPickMonth')}
                  warn={birthWarn}
                />
              )}
              {field === 'english' && (
                <SubMonthRow
                  label={t('tlTestShort')}
                  value={dates.englishTest}
                  onChange={(v) => onDatesPatch({ englishTest: v })}
                  placeholder={t('tlPickMonth')}
                  note={englishNote}
                />
              )}
            </div>
          );
        })}
      </div>

      {bonusGroups.map((group) => (
        <div key={group.id} className="mt-[30px]">
          <div className="text-[11.5px] tracking-[0.16em] font-medium" style={{ color: 'var(--muted)' }}>
            {t(`groups.${group.id}`)}
          </div>
          <div className="grid gap-x-9 mt-1.5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(290px, 100%), 1fr))' }}>
            {group.items.map((name: SharedBonusField) => (
              <div key={name}>
                <CheckRow
                  label={t(`boxes.${name}`)}
                  checked={shared[name]}
                  points={sharedBonusCriteria[name]}
                  onToggle={() => onPatch({ [name]: !shared[name] })}
                />
                {name === 'communityLanguage' && shared.communityLanguage && (
                  <div className="pl-7 pr-1.5 pb-2">
                    <SubMonthRow
                      label={t('tlCertShort')}
                      value={dates.naatiCert}
                      onChange={(v) => onDatesPatch({ naatiCert: v })}
                      placeholder={t('tlPickMonth')}
                      note={naatiNote}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

export default memo(SharedCriteriaSection);
