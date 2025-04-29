'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

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

  const calculatePoints = () => {
    let points = 0;

    // Age points
    switch (formData.age) {
      case '18-24':
        points += 25;
        break;
      case '25-32':
        points += 30;
        break;
      case '33-39':
        points += 25;
        break;
      case '40-44':
        points += 15;
        break;
    }

    // English points
    switch (formData.english) {
      case 'ielts7':
        points += 10;
        break;
      case 'ielts8':
        points += 20;
        break;
    }

    // Australian work experience
    switch (formData.ausWork) {
      case '1-3':
        points += 5;
        break;
      case '3-5':
        points += 10;
        break;
      case '5-8':
        points += 15;
        break;
      case '8-10':
        points += 20;
        break;
    }

    // Overseas work experience
    switch (formData.overseasWork) {
      case '3-5':
        points += 5;
        break;
      case '5-8':
        points += 10;
        break;
      case '8-10':
        points += 15;
        break;
    }

    // Education points
    switch (formData.education) {
      case 'apprenticeship':
      case 'cert3':
      case 'diploma':
        points += 10;
        break;
      case 'bachelor':
        points += 15;
        break;
      case 'phd':
        points += 20;
        break;
    }

    // Additional points
    if (formData.stem) points += 10;
    if (formData.ausStudy) points += 5;
    if (formData.communityLanguage) points += 5;
    if (formData.professionalYear) points += 5;
    if (formData.stateNomination) points += 5;
    if (formData.regionalNomination) points += 15;
    if (formData.regionalStudy) points += 5;

    // Partner points
    switch (formData.partnerStatus) {
      case 'single':
      case 'partnerSkills':
      case 'partnerCitizen':
        points += 10;
        break;
      case 'partnerEnglish':
        points += 5;
        break;
    }

    return points;
  };

  useEffect(() => {
    const points = calculatePoints();
    onPointsChange(points);
  }, [formData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  return (
    <form className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Age */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('sections.age')}
          </label>
          <select
            name="age"
            value={formData.age}
            onChange={handleChange}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
          >
            <option value="">{t('select.age')}</option>
            <option value="18-24">18-24 {t('age')}</option>
            <option value="25-32">25-32 {t('age')}</option>
            <option value="33-39">33-39 {t('age')}</option>
            <option value="40-44">40-44 {t('age')}</option>
          </select>
        </div>

        {/* English */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('sections.english')}
          </label>
          <select
            name="english"
            value={formData.english}
            onChange={handleChange}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
          >
            <option value="">{t('select.english')}</option>
            <option value="ielts6">IELTS 6 ({t('english.competent')})</option>
            <option value="ielts7">IELTS 7 ({t('english.proficient')})</option>
            <option value="ielts8">IELTS 8 ({t('english.superior')})</option>
          </select>
        </div>

        {/* Australian Work Experience */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('sections.ausWork')}
          </label>
          <select
            name="ausWork"
            value={formData.ausWork}
            onChange={handleChange}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
          >
            <option value="">{t('select.years')}</option>
            <option value="1-3">1-3 {t('years')}</option>
            <option value="3-5">3-5 {t('years')}</option>
            <option value="5-8">5-8 {t('years')}</option>
            <option value="8-10">8-10 {t('years')}</option>
          </select>
        </div>

        {/* Overseas Work Experience */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('sections.overseasWork')}
          </label>
          <select
            name="overseasWork"
            value={formData.overseasWork}
            onChange={handleChange}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
          >
            <option value="">{t('select.years')}</option>
            <option value="3-5">3-5 {t('years')}</option>
            <option value="5-8">5-8 {t('years')}</option>
            <option value="8-10">8-10 {t('years')}</option>
          </select>
        </div>

        {/* Education */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('sections.education')}
          </label>
          <select
            name="education"
            value={formData.education}
            onChange={handleChange}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
          >
            <option value="">{t('select.education')}</option>
            <option value="apprenticeship">{t('education.apprenticeship')}</option>
            <option value="cert3">{t('education.cert3')}</option>
            <option value="diploma">{t('education.diploma')}</option>
            <option value="bachelor">{t('education.bachelor')}</option>
            <option value="phd">{t('education.phd')}</option>
          </select>
        </div>

        {/* Partner Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('sections.partnerStatus')}
          </label>
          <select
            name="partnerStatus"
            value={formData.partnerStatus}
            onChange={handleChange}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
          >
            <option value="">{t('select.partner')}</option>
            <option value="single">{t('partner.single')}</option>
            <option value="partnerSkills">{t('partner.skills')}</option>
            <option value="partnerCitizen">{t('partner.citizen')}</option>
            <option value="partnerEnglish">{t('partner.english')}</option>
          </select>
        </div>
      </div>

      {/* Checkboxes */}
      <div className="space-y-6">
        {/* Education Related */}
        <div className="bg-white rounded-lg shadow p-4 space-y-3">
          <h3 className="font-medium text-gray-900 border-b pb-2">{t('groupTitles.educationBonus')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start space-x-2">
              <input
                type="checkbox"
                name="stem"
                checked={formData.stem}
                onChange={handleChange}
                className="mt-1 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label className="text-sm text-gray-700">{t('sections.stem')}</label>
            </div>

            <div className="flex items-start space-x-2">
              <input
                type="checkbox"
                name="ausStudy"
                checked={formData.ausStudy}
                onChange={handleChange}
                className="mt-1 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label className="text-sm text-gray-700">{t('sections.ausStudy')}</label>
            </div>

            <div className="flex items-start space-x-2">
              <input
                type="checkbox"
                name="regionalStudy"
                checked={formData.regionalStudy}
                onChange={handleChange}
                className="mt-1 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label className="text-sm text-gray-700">{t('sections.regionalStudy')}</label>
            </div>

            <div className="flex items-start space-x-2">
              <input
                type="checkbox"
                name="professionalYear"
                checked={formData.professionalYear}
                onChange={handleChange}
                className="mt-1 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label className="text-sm text-gray-700">{t('sections.professionalYear')}</label>
            </div>
          </div>
        </div>

        {/* Language and Skills */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-medium text-gray-900 border-b pb-2 mb-3">{t('groupTitles.languageSkillsBonus')}</h3>
          <div className="flex items-start space-x-2">
            <input
              type="checkbox"
              name="communityLanguage"
              checked={formData.communityLanguage}
              onChange={handleChange}
              className="mt-1 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <label className="text-sm text-gray-700">{t('sections.communityLanguage')}</label>
          </div>
        </div>

        {/* Nomination */}
        <div className="bg-white rounded-lg shadow p-4 space-y-3">
          <h3 className="font-medium text-gray-900 border-b pb-2">{t('groupTitles.nominationBonus')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start space-x-2">
              <input
                type="checkbox"
                name="stateNomination"
                checked={formData.stateNomination}
                onChange={handleChange}
                className="mt-1 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label className="text-sm text-gray-700">{t('sections.stateNomination')}</label>
            </div>

            <div className="flex items-start space-x-2">
              <input
                type="checkbox"
                name="regionalNomination"
                checked={formData.regionalNomination}
                onChange={handleChange}
                className="mt-1 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label className="text-sm text-gray-700">{t('sections.regionalNomination')}</label>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
} 