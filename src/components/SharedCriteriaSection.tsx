'use client';

import { useTranslation } from 'react-i18next';
import SectionHeading from './SectionHeading';
import SelectField from './SelectField';
import CheckRow from './CheckRow';
import type { SharedCriteria } from '@/lib/types';
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
}

const SELECT_FIELDS: SharedSelectField[] = ['age', 'english', 'education', 'partnerStatus'];

export default function SharedCriteriaSection({
  shared, onPatch, openSelect, setOpenSelect,
}: SharedCriteriaSectionProps) {
  const { t } = useTranslation();

  const zActive = openSelect?.startsWith('sh:');

  return (
    <section
      className="mt-[76px] relative"
      style={{ zIndex: zActive ? 30 : 'auto', animation: 'eoiFadeUp 0.7s ease 0.08s both' }}
    >
      <SectionHeading num="01" title={t('sections.shared')} side="SHARED" />
      <p className="mt-3.5 mb-0 text-[12.5px] leading-[1.7] max-w-[46em]" style={{ color: 'var(--muted)' }}>
        {t('sharedNote')}
      </p>

      <div className="grid gap-x-9 gap-y-[30px] mt-[30px]" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))' }}>
        {SELECT_FIELDS.map((field) => {
          const key = `sh:${field}`;
          return (
            <SelectField
              key={field}
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
            />
          );
        })}
      </div>

      {bonusGroups.map((group) => (
        <div key={group.id} className="mt-[30px]">
          <div className="text-[11.5px] tracking-[0.16em] font-medium" style={{ color: 'var(--muted)' }}>
            {t(`groups.${group.id}`)}
          </div>
          <div className="grid gap-x-9 mt-1.5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))' }}>
            {group.items.map((name: SharedBonusField) => (
              <CheckRow
                key={name}
                label={t(`boxes.${name}`)}
                checked={shared[name]}
                points={sharedBonusCriteria[name]}
                onToggle={() => onPatch({ [name]: !shared[name] })}
              />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
