'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import Select from './Select';

interface CalculatorFormProps {
  onPointsChange: (points: number) => void;
}

export default function CalculatorForm({ onPointsChange }: CalculatorFormProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    age: '',
    english: '',
    ausWork: '',
    overseasWork: '',
    education: '',
    stem: false,
    ausStudy: false,
    communityLanguage: false,
    partnerStatus: '',
    professionalYear: false,
    stateNomination: false,
    regionalNomination: false,
    regionalStudy: false,
  });

  const calculatePoints = useCallback(() => {
    let points = 0;

    switch (formData.age) {
      case '18-24': points += 25; break;
      case '25-32': points += 30; break;
      case '33-39': points += 25; break;
      case '40-44': points += 15; break;
    }

    switch (formData.english) {
      case 'ielts7': points += 10; break;
      case 'ielts8': points += 20; break;
    }

    switch (formData.ausWork) {
      case '1-3': points += 5; break;
      case '3-5': points += 10; break;
      case '5-8': points += 15; break;
      case '8-10': points += 20; break;
    }

    switch (formData.overseasWork) {
      case '3-5': points += 5; break;
      case '5-8': points += 10; break;
      case '8-10': points += 15; break;
    }

    switch (formData.education) {
      case 'apprenticeship':
      case 'cert3':
      case 'diploma': points += 10; break;
      case 'bachelor': points += 15; break;
      case 'phd': points += 20; break;
    }

    if (formData.stem) points += 10;
    if (formData.ausStudy) points += 5;
    if (formData.communityLanguage) points += 5;
    if (formData.professionalYear) points += 5;
    if (formData.stateNomination) points += 5;
    if (formData.regionalNomination) points += 15;
    if (formData.regionalStudy) points += 5;

    switch (formData.partnerStatus) {
      case 'single':
      case 'partnerSkills':
      case 'partnerCitizen': points += 10; break;
      case 'partnerEnglish': points += 5; break;
    }

    return points;
  }, [formData]);

  // #2 fix: include all dependencies
  useEffect(() => {
    onPointsChange(calculatePoints());
  }, [calculatePoints, onPointsChange]);

  // Select handler — only handles select events
  const handleSelectChange = useCallback((e: { target: { name: string; value: string } }) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  // Checkbox handler — handles mutual exclusion for nominations
  const handleCheckboxChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;

    if (name === 'stateNomination' && checked) {
      setFormData(prev => ({ ...prev, stateNomination: true, regionalNomination: false }));
      return;
    }
    if (name === 'regionalNomination' && checked) {
      setFormData(prev => ({ ...prev, regionalNomination: true, stateNomination: false }));
      return;
    }
    setFormData(prev => ({ ...prev, [name]: checked }));
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.04 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 8 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' as const } }
  };

  const selectFields = [
    {
      label: t('sections.age'),
      name: 'age',
      placeholder: t('select.age'),
      options: [
        { value: '18-24', label: `18-24 ${t('age')}` },
        { value: '25-32', label: `25-32 ${t('age')}` },
        { value: '33-39', label: `33-39 ${t('age')}` },
        { value: '40-44', label: `40-44 ${t('age')}` },
      ]
    },
    {
      label: t('sections.english'),
      name: 'english',
      placeholder: t('select.english'),
      options: [
        { value: 'ielts6', label: t('english.competent') },
        { value: 'ielts7', label: t('english.proficient') },
        { value: 'ielts8', label: t('english.superior') },
      ]
    },
    {
      label: t('sections.ausWork'),
      name: 'ausWork',
      placeholder: t('select.years'),
      options: [
        { value: '1-3', label: `1-3 ${t('years')}` },
        { value: '3-5', label: `3-5 ${t('years')}` },
        { value: '5-8', label: `5-8 ${t('years')}` },
        { value: '8-10', label: `8-10 ${t('years')}` },
      ]
    },
    {
      label: t('sections.overseasWork'),
      name: 'overseasWork',
      placeholder: t('select.years'),
      options: [
        { value: '3-5', label: `3-5 ${t('years')}` },
        { value: '5-8', label: `5-8 ${t('years')}` },
        { value: '8-10', label: `8-10 ${t('years')}` },
      ]
    },
    {
      label: t('sections.education'),
      name: 'education',
      placeholder: t('select.education'),
      options: [
        { value: 'apprenticeship', label: t('education.apprenticeship') },
        { value: 'cert3', label: t('education.cert3') },
        { value: 'diploma', label: t('education.diploma') },
        { value: 'bachelor', label: t('education.bachelor') },
        { value: 'phd', label: t('education.phd') },
      ]
    },
    {
      label: t('sections.partnerStatus'),
      name: 'partnerStatus',
      placeholder: t('select.partner'),
      options: [
        { value: 'single', label: t('partner.single') },
        { value: 'partnerSkills', label: t('partner.skills') },
        { value: 'partnerCitizen', label: t('partner.citizen') },
        { value: 'partnerEnglish', label: t('partner.english') },
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
      {/* Primary fields */}
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
              value={formData[field.name as keyof typeof formData] as string}
              options={field.options}
              placeholder={field.placeholder}
              label={field.label}
              onChange={handleSelectChange}
            />
          </motion.div>
        ))}
      </div>

      {/* Divider */}
      <div style={{ borderTop: '1px solid var(--border-primary)' }} />

      {/* Bonus sections */}
      <div className="space-y-8">
        {/* Education Bonuses */}
        <motion.div variants={itemVariants}>
          <h3
            className="text-xs font-medium tracking-wide uppercase mb-4"
            style={{ color: 'var(--text-secondary)' }}
          >
            {t('groupTitles.educationBonus')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {[
              { name: 'stem', label: t('sections.stem') },
              { name: 'ausStudy', label: t('sections.ausStudy') },
              { name: 'regionalStudy', label: t('sections.regionalStudy') },
              { name: 'professionalYear', label: t('sections.professionalYear') },
            ].map((item) => (
              <label
                key={item.name}
                className="flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors duration-150 hover:bg-[var(--bg-surface-hover)]"
              >
                <input
                  type="checkbox"
                  name={item.name}
                  checked={formData[item.name as keyof typeof formData] as boolean}
                  onChange={handleCheckboxChange}
                  className="mt-0.5"
                />
                <span
                  className="text-sm leading-snug"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {item.label}
                </span>
              </label>
            ))}
          </div>
        </motion.div>

        {/* Language Bonus */}
        <motion.div variants={itemVariants}>
          <h3
            className="text-xs font-medium tracking-wide uppercase mb-4"
            style={{ color: 'var(--text-secondary)' }}
          >
            {t('groupTitles.languageSkillsBonus')}
          </h3>
          <label
            className="flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors duration-150 hover:bg-[var(--bg-surface-hover)]"
          >
            <input
              type="checkbox"
              name="communityLanguage"
              checked={formData.communityLanguage}
              onChange={handleCheckboxChange}
              className="mt-0.5"
            />
            <span
              className="text-sm leading-snug"
              style={{ color: 'var(--text-primary)' }}
            >
              {t('sections.communityLanguage')}
            </span>
          </label>
        </motion.div>

        {/* Nomination Bonus */}
        <motion.div variants={itemVariants}>
          <h3
            className="text-xs font-medium tracking-wide uppercase mb-4"
            style={{ color: 'var(--text-secondary)' }}
          >
            {t('groupTitles.nominationBonus')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {[
              { name: 'stateNomination', label: t('sections.stateNomination') },
              { name: 'regionalNomination', label: t('sections.regionalNomination') },
            ].map((item) => (
              <label
                key={item.name}
                className="flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors duration-150 hover:bg-[var(--bg-surface-hover)]"
              >
                <input
                  type="checkbox"
                  name={item.name}
                  checked={formData[item.name as keyof typeof formData] as boolean}
                  onChange={handleCheckboxChange}
                  className="mt-0.5"
                />
                <span
                  className="text-sm leading-snug"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {item.label}
                </span>
              </label>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.form>
  );
}
