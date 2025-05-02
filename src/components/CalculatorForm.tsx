'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { 
  FaUser, 
  FaLanguage, 
  FaBriefcase, 
  FaGraduationCap, 
  FaUsers,
  FaAward,
  FaGlobe,
  FaMapMarkedAlt
} from 'react-icons/fa';

interface CalculatorFormProps {
  onPointsChange: (points: number) => void;
}

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

const cardHover = {
  hover: { 
    scale: 1.02,
    boxShadow: "0 8px 30px rgba(124, 58, 237, 0.08)",
    transition: { duration: 0.2 }
  }
};

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
    
    // Handle nomination mutual exclusivity
    if (name === 'stateNomination' && (e.target as HTMLInputElement).checked) {
      setFormData(prev => ({
        ...prev,
        stateNomination: true,
        regionalNomination: false
      }));
      return;
    }
    
    if (name === 'regionalNomination' && (e.target as HTMLInputElement).checked) {
      setFormData(prev => ({
        ...prev,
        regionalNomination: true,
        stateNomination: false
      }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  return (
    <motion.form 
      className="space-y-4 md:space-y-6 px-4 md:px-0 max-w-5xl mx-auto pb-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Main Form Fields */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Age Section */}
        <motion.div 
          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-primary-100 dark:border-primary-900 p-3 md:p-4"
          variants={cardHover}
          whileHover="hover"
          {...fadeInUp}
        >
          <div className="flex items-center space-x-2 mb-3 md:mb-4 text-primary-600">
            <motion.div 
              whileHover={{ scale: 1.1 }}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-primary-50"
            >
              <FaUser className="text-lg" />
            </motion.div>
            <h3 className="font-medium text-gray-900 dark:text-gray-100 text-base md:text-lg">{t('sections.age')}</h3>
          </div>
          <motion.select
            name="age"
            value={formData.age}
            onChange={handleChange}
            className="w-full h-12 md:h-10 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-200 focus:ring-opacity-50 text-base md:text-sm"
            whileTap={{ scale: 0.98 }}
          >
            <option value="">{t('select.age')}</option>
            <option value="18-24">18-24 {t('age')}</option>
            <option value="25-32">25-32 {t('age')}</option>
            <option value="33-39">33-39 {t('age')}</option>
            <option value="40-44">40-44 {t('age')}</option>
          </motion.select>
        </motion.div>

        {/* English Section */}
        <motion.div 
          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-primary-100 dark:border-primary-900 p-3 md:p-4"
          variants={cardHover}
          whileHover="hover"
          {...fadeInUp}
        >
          <div className="flex items-center space-x-2 mb-3 md:mb-4 text-primary-600">
            <motion.div 
              whileHover={{ scale: 1.1 }}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-primary-50"
            >
              <FaLanguage className="text-lg" />
            </motion.div>
            <h3 className="font-medium text-gray-900 dark:text-gray-100 text-base md:text-lg">{t('sections.english')}</h3>
          </div>
          <motion.select
            name="english"
            value={formData.english}
            onChange={handleChange}
            className="w-full h-12 md:h-10 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-200 focus:ring-opacity-50 text-base md:text-sm"
            whileTap={{ scale: 0.98 }}
          >
            <option value="">{t('select.english')}</option>
            <option value="ielts6">{t('english.competent')}</option>
            <option value="ielts7">{t('english.proficient')}</option>
            <option value="ielts8">{t('english.superior')}</option>
          </motion.select>
        </motion.div>

        {/* Work Experience Sections */}
        <motion.div 
          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-primary-100 dark:border-primary-900 p-3 md:p-4"
          variants={cardHover}
          whileHover="hover"
          {...fadeInUp}
        >
          <div className="flex items-center space-x-2 mb-3 md:mb-4 text-primary-600">
            <motion.div 
              whileHover={{ scale: 1.1 }}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-primary-50"
            >
              <FaBriefcase className="text-lg" />
            </motion.div>
            <h3 className="font-medium text-gray-900 dark:text-gray-100 text-base md:text-lg">{t('sections.ausWork')}</h3>
          </div>
          <motion.select
            name="ausWork"
            value={formData.ausWork}
            onChange={handleChange}
            className="w-full h-12 md:h-10 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-200 focus:ring-opacity-50 text-base md:text-sm"
            whileTap={{ scale: 0.98 }}
          >
            <option value="">{t('select.years')}</option>
            <option value="1-3">1-3 {t('years')}</option>
            <option value="3-5">3-5 {t('years')}</option>
            <option value="5-8">5-8 {t('years')}</option>
            <option value="8-10">8-10 {t('years')}</option>
          </motion.select>
        </motion.div>

        <motion.div 
          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-primary-100 dark:border-primary-900 p-3 md:p-4"
          variants={cardHover}
          whileHover="hover"
          {...fadeInUp}
        >
          <div className="flex items-center space-x-2 mb-3 md:mb-4 text-primary-600">
            <motion.div 
              whileHover={{ scale: 1.1 }}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-primary-50"
            >
              <FaGlobe className="text-lg" />
            </motion.div>
            <h3 className="font-medium text-gray-900 dark:text-gray-100 text-base md:text-lg">{t('sections.overseasWork')}</h3>
          </div>
          <motion.select
            name="overseasWork"
            value={formData.overseasWork}
            onChange={handleChange}
            className="w-full h-12 md:h-10 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-200 focus:ring-opacity-50 text-base md:text-sm"
            whileTap={{ scale: 0.98 }}
          >
            <option value="">{t('select.years')}</option>
            <option value="3-5">3-5 {t('years')}</option>
            <option value="5-8">5-8 {t('years')}</option>
            <option value="8-10">8-10 {t('years')}</option>
          </motion.select>
        </motion.div>

        {/* Education Section */}
        <motion.div 
          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-primary-100 dark:border-primary-900 p-3 md:p-4"
          variants={cardHover}
          whileHover="hover"
          {...fadeInUp}
        >
          <div className="flex items-center space-x-2 mb-3 md:mb-4 text-primary-600">
            <motion.div 
              whileHover={{ scale: 1.1 }}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-primary-50"
            >
              <FaGraduationCap className="text-lg" />
            </motion.div>
            <h3 className="font-medium text-gray-900 dark:text-gray-100 text-base md:text-lg">{t('sections.education')}</h3>
          </div>
          <motion.select
            name="education"
            value={formData.education}
            onChange={handleChange}
            className="w-full h-12 md:h-10 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-200 focus:ring-opacity-50 text-base md:text-sm"
            whileTap={{ scale: 0.98 }}
          >
            <option value="">{t('select.education')}</option>
            <option value="apprenticeship">{t('education.apprenticeship')}</option>
            <option value="cert3">{t('education.cert3')}</option>
            <option value="diploma">{t('education.diploma')}</option>
            <option value="bachelor">{t('education.bachelor')}</option>
            <option value="phd">{t('education.phd')}</option>
          </motion.select>
        </motion.div>

        {/* Partner Status Section */}
        <motion.div 
          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-primary-100 dark:border-primary-900 p-3 md:p-4"
          variants={cardHover}
          whileHover="hover"
          {...fadeInUp}
        >
          <div className="flex items-center space-x-2 mb-3 md:mb-4 text-primary-600">
            <motion.div 
              whileHover={{ scale: 1.1 }}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-primary-50"
            >
              <FaUsers className="text-lg" />
            </motion.div>
            <h3 className="font-medium text-gray-900 dark:text-gray-100 text-base md:text-lg">{t('sections.partnerStatus')}</h3>
          </div>
          <motion.select
            name="partnerStatus"
            value={formData.partnerStatus}
            onChange={handleChange}
            className="w-full h-12 md:h-10 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-200 focus:ring-opacity-50 text-base md:text-sm"
            whileTap={{ scale: 0.98 }}
          >
            <option value="">{t('select.partner')}</option>
            <option value="single">{t('partner.single')}</option>
            <option value="partnerSkills">{t('partner.skills')}</option>
            <option value="partnerCitizen">{t('partner.citizen')}</option>
            <option value="partnerEnglish">{t('partner.english')}</option>
          </motion.select>
        </motion.div>
      </div>

      {/* Bonus Points Sections */}
      <div className="space-y-4 md:space-y-6">
        {/* Education Related */}
        <motion.div 
          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-primary-100 dark:border-primary-900 p-3 md:p-4 space-y-3"
          variants={cardHover}
          whileHover="hover"
          {...fadeInUp}
        >
          <div className="flex items-center space-x-2 pb-2 border-b border-primary-100 text-primary-600">
            <motion.div 
              whileHover={{ scale: 1.1 }}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-primary-50"
            >
              <FaAward className="text-lg" />
            </motion.div>
            <h3 className="font-medium text-gray-900 dark:text-gray-100 text-base md:text-lg">{t('groupTitles.educationBonus')}</h3>
          </div>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2 md:gap-4">
            <motion.label 
              className="flex items-start space-x-3 p-3 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors cursor-pointer touch-manipulation"
              whileHover={{ backgroundColor: "rgb(245, 243, 255)" }}
              whileTap={{ scale: 0.98 }}
            >
              <input
                type="checkbox"
                name="stem"
                checked={formData.stem}
                onChange={handleChange}
                className="mt-1 w-5 h-5 rounded border-primary-300 dark:border-primary-700 text-primary-600 dark:text-primary-400 focus:ring-primary-200 dark:focus:ring-primary-800"
              />
              <span className="text-sm md:text-base text-gray-700 dark:text-gray-300 leading-tight">{t('sections.stem')}</span>
            </motion.label>

            <motion.label 
              className="flex items-start space-x-3 p-3 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors cursor-pointer touch-manipulation"
              whileHover={{ backgroundColor: "rgb(245, 243, 255)" }}
              whileTap={{ scale: 0.98 }}
            >
              <input
                type="checkbox"
                name="ausStudy"
                checked={formData.ausStudy}
                onChange={handleChange}
                className="mt-1 w-5 h-5 rounded border-primary-300 dark:border-primary-700 text-primary-600 dark:text-primary-400 focus:ring-primary-200 dark:focus:ring-primary-800"
              />
              <span className="text-sm md:text-base text-gray-700 dark:text-gray-300 leading-tight">{t('sections.ausStudy')}</span>
            </motion.label>

            <motion.label 
              className="flex items-start space-x-3 p-3 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors cursor-pointer touch-manipulation"
              whileHover={{ backgroundColor: "rgb(245, 243, 255)" }}
              whileTap={{ scale: 0.98 }}
            >
              <input
                type="checkbox"
                name="regionalStudy"
                checked={formData.regionalStudy}
                onChange={handleChange}
                className="mt-1 w-5 h-5 rounded border-primary-300 dark:border-primary-700 text-primary-600 dark:text-primary-400 focus:ring-primary-200 dark:focus:ring-primary-800"
              />
              <span className="text-sm md:text-base text-gray-700 dark:text-gray-300 leading-tight">{t('sections.regionalStudy')}</span>
            </motion.label>

            <motion.label 
              className="flex items-start space-x-3 p-3 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors cursor-pointer touch-manipulation"
              whileHover={{ backgroundColor: "rgb(245, 243, 255)" }}
              whileTap={{ scale: 0.98 }}
            >
              <input
                type="checkbox"
                name="professionalYear"
                checked={formData.professionalYear}
                onChange={handleChange}
                className="mt-1 w-5 h-5 rounded border-primary-300 dark:border-primary-700 text-primary-600 dark:text-primary-400 focus:ring-primary-200 dark:focus:ring-primary-800"
              />
              <span className="text-sm md:text-base text-gray-700 dark:text-gray-300 leading-tight">{t('sections.professionalYear')}</span>
            </motion.label>
          </div>
        </motion.div>

        {/* Language and Skills */}
        <motion.div 
          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-primary-100 dark:border-primary-900 p-3 md:p-4"
          variants={cardHover}
          whileHover="hover"
          {...fadeInUp}
        >
          <div className="flex items-center space-x-2 pb-2 border-b border-primary-100 text-primary-600">
            <motion.div 
              whileHover={{ scale: 1.1 }}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-primary-50"
            >
              <FaLanguage className="text-lg" />
            </motion.div>
            <h3 className="font-medium text-gray-900 dark:text-gray-100 text-base md:text-lg">{t('groupTitles.languageSkillsBonus')}</h3>
          </div>
          <motion.label 
            className="flex items-start space-x-3 p-3 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors mt-3 cursor-pointer touch-manipulation"
            whileHover={{ backgroundColor: "rgb(245, 243, 255)" }}
            whileTap={{ scale: 0.98 }}
          >
            <input
              type="checkbox"
              name="communityLanguage"
              checked={formData.communityLanguage}
              onChange={handleChange}
              className="mt-1 w-5 h-5 rounded border-primary-300 dark:border-primary-700 text-primary-600 dark:text-primary-400 focus:ring-primary-200 dark:focus:ring-primary-800"
            />
            <span className="text-sm md:text-base text-gray-700 dark:text-gray-300 leading-tight">{t('sections.communityLanguage')}</span>
          </motion.label>
        </motion.div>

        {/* Nomination */}
        <motion.div 
          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-primary-100 dark:border-primary-900 p-3 md:p-4 space-y-3"
          variants={cardHover}
          whileHover="hover"
          {...fadeInUp}
        >
          <div className="flex items-center space-x-2 pb-2 border-b border-primary-100 text-primary-600">
            <motion.div 
              whileHover={{ scale: 1.1 }}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-primary-50"
            >
              <FaMapMarkedAlt className="text-lg" />
            </motion.div>
            <h3 className="font-medium text-gray-900 dark:text-gray-100 text-base md:text-lg">{t('groupTitles.nominationBonus')}</h3>
          </div>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2 md:gap-4">
            <motion.label 
              className="flex items-start space-x-3 p-3 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors cursor-pointer touch-manipulation"
              whileHover={{ backgroundColor: "rgb(245, 243, 255)" }}
              whileTap={{ scale: 0.98 }}
            >
              <input
                type="checkbox"
                name="stateNomination"
                checked={formData.stateNomination}
                onChange={handleChange}
                className="mt-1 w-5 h-5 rounded border-primary-300 dark:border-primary-700 text-primary-600 dark:text-primary-400 focus:ring-primary-200 dark:focus:ring-primary-800"
              />
              <span className="text-sm md:text-base text-gray-700 dark:text-gray-300 leading-tight">{t('sections.stateNomination')}</span>
            </motion.label>

            <motion.label 
              className="flex items-start space-x-3 p-3 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors cursor-pointer touch-manipulation"
              whileHover={{ backgroundColor: "rgb(245, 243, 255)" }}
              whileTap={{ scale: 0.98 }}
            >
              <input
                type="checkbox"
                name="regionalNomination"
                checked={formData.regionalNomination}
                onChange={handleChange}
                className="mt-1 w-5 h-5 rounded border-primary-300 dark:border-primary-700 text-primary-600 dark:text-primary-400 focus:ring-primary-200 dark:focus:ring-primary-800"
              />
              <span className="text-sm md:text-base text-gray-700 dark:text-gray-300 leading-tight">{t('sections.regionalNomination')}</span>
            </motion.label>
          </div>
        </motion.div>
      </div>
    </motion.form>
  );
} 