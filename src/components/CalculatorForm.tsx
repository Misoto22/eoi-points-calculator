'use client';

import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import Select from './Select';
import type { FormData } from '@/lib/types';

interface CalculatorFormProps {
  formData: FormData;
  onChange: (data: FormData) => void;
}

export default function CalculatorForm({ formData, onChange }: CalculatorFormProps) {
  const { t } = useTranslation();

  const handleSelectChange = useCallback((e: { target: { name: string; value: string } }) => {
    const { name, value } = e.target;
    onChange({ ...formData, [name]: value });
  }, [formData, onChange]);

  const handleCheckboxChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;

    if (name === 'stateNomination' && checked) {
      onChange({ ...formData, stateNomination: true, regionalNomination: false });
      return;
    }
    if (name === 'regionalNomination' && checked) {
      onChange({ ...formData, regionalNomination: true, stateNomination: false });
      return;
    }
    onChange({ ...formData, [name]: checked });
  }, [formData, onChange]);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.04 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 8 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' as const } }
  };

  const pts = (n: number) => `(+${n})`;
  const p0 = '(+0)';

  const selectFields = [
    {
      label: t('sections.age'), name: 'age', placeholder: t('select.age'),
      options: [
        { value: '18-24', label: `18-24 ${t('age')} ${pts(25)}` },
        { value: '25-32', label: `25-32 ${t('age')} ${pts(30)}` },
        { value: '33-39', label: `33-39 ${t('age')} ${pts(25)}` },
        { value: '40-44', label: `40-44 ${t('age')} ${pts(15)}` },
      ]
    },
    {
      label: t('sections.english'), name: 'english', placeholder: t('select.english'),
      options: [
        { value: 'ielts6', label: `${t('english.competent')}` },
        { value: 'ielts7', label: `${t('english.proficient')} ${pts(10)}` },
        { value: 'ielts8', label: `${t('english.superior')} ${pts(20)}` },
      ]
    },
    {
      label: t('sections.ausWork'), name: 'ausWork', placeholder: t('select.years'),
      options: [
        { value: '1-3', label: `1-3 ${t('years')} ${pts(5)}` },
        { value: '3-5', label: `3-5 ${t('years')} ${pts(10)}` },
        { value: '5-8', label: `5-8 ${t('years')} ${pts(15)}` },
        { value: '8-10', label: `8-10 ${t('years')} ${pts(20)}` },
      ]
    },
    {
      label: t('sections.overseasWork'), name: 'overseasWork', placeholder: t('select.years'),
      options: [
        { value: '3-5', label: `3-5 ${t('years')} ${pts(5)}` },
        { value: '5-8', label: `5-8 ${t('years')} ${pts(10)}` },
        { value: '8-10', label: `8-10 ${t('years')} ${pts(15)}` },
      ]
    },
    {
      label: t('sections.education'), name: 'education', placeholder: t('select.education'),
      options: [
        { value: 'apprenticeship', label: `${t('education.apprenticeship')} ${pts(10)}` },
        { value: 'cert3', label: `${t('education.cert3')} ${pts(10)}` },
        { value: 'diploma', label: `${t('education.diploma')} ${pts(10)}` },
        { value: 'bachelor', label: `${t('education.bachelor')} ${pts(15)}` },
        { value: 'phd', label: `${t('education.phd')} ${pts(20)}` },
      ]
    },
    {
      label: t('sections.partnerStatus'), name: 'partnerStatus', placeholder: t('select.partner'),
      options: [
        { value: 'single', label: `${t('partner.single')} ${pts(10)}` },
        { value: 'partnerSkills', label: `${t('partner.skills')} ${pts(10)}` },
        { value: 'partnerCitizen', label: `${t('partner.citizen')} ${pts(10)}` },
        { value: 'partnerEnglish', label: `${t('partner.english')} ${pts(5)}` },
      ]
    },
  ];

  return (
    <motion.form
      className="space-y-10"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
        {selectFields.map((field) => (
          <motion.div key={field.name} variants={itemVariants}>
            <label
              className="block text-xs font-medium tracking-wide uppercase mb-2"
              style={{ color: 'var(--text-secondary)' }}
            >
              {field.label}
            </label>
            <Select
              name={field.name}
              value={formData[field.name as keyof FormData] as string}
              options={field.options}
              placeholder={field.placeholder}
              label={field.label}
              onChange={handleSelectChange}
            />
          </motion.div>
        ))}
      </div>

      <div style={{ borderTop: '1px solid var(--border-primary)' }} />

      <div className="space-y-8">
        <motion.div variants={itemVariants}>
          <h3 className="text-xs font-medium tracking-wide uppercase mb-4" style={{ color: 'var(--text-secondary)' }}>
            {t('groupTitles.educationBonus')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {(['stem', 'ausStudy', 'regionalStudy', 'professionalYear'] as const).map((name) => (
              <label key={name} className="flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors duration-150 hover:bg-[var(--bg-surface-hover)]">
                <input type="checkbox" name={name} checked={formData[name]} onChange={handleCheckboxChange} className="mt-0.5" />
                <span className="text-sm leading-snug" style={{ color: 'var(--text-primary)' }}>{t(`sections.${name}`)}</span>
              </label>
            ))}
          </div>
        </motion.div>

        <motion.div variants={itemVariants}>
          <h3 className="text-xs font-medium tracking-wide uppercase mb-4" style={{ color: 'var(--text-secondary)' }}>
            {t('groupTitles.languageSkillsBonus')}
          </h3>
          <label className="flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors duration-150 hover:bg-[var(--bg-surface-hover)]">
            <input type="checkbox" name="communityLanguage" checked={formData.communityLanguage} onChange={handleCheckboxChange} className="mt-0.5" />
            <span className="text-sm leading-snug" style={{ color: 'var(--text-primary)' }}>{t('sections.communityLanguage')}</span>
          </label>
        </motion.div>

        <motion.div variants={itemVariants}>
          <h3 className="text-xs font-medium tracking-wide uppercase mb-4" style={{ color: 'var(--text-secondary)' }}>
            {t('groupTitles.nominationBonus')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {(['stateNomination', 'regionalNomination'] as const).map((name) => (
              <label key={name} className="flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors duration-150 hover:bg-[var(--bg-surface-hover)]">
                <input type="checkbox" name={name} checked={formData[name]} onChange={handleCheckboxChange} className="mt-0.5" />
                <span className="text-sm leading-snug" style={{ color: 'var(--text-primary)' }}>{t(`sections.${name}`)}</span>
              </label>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.form>
  );
}
