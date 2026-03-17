import type { FormData, PointsBreakdown } from './types';

export function calculateBreakdown(data: FormData): PointsBreakdown {
  let age = 0;
  switch (data.age) {
    case '18-24': age = 25; break;
    case '25-32': age = 30; break;
    case '33-39': age = 25; break;
    case '40-44': age = 15; break;
  }

  let english = 0;
  switch (data.english) {
    case 'ielts7': english = 10; break;
    case 'ielts8': english = 20; break;
  }

  let ausWork = 0;
  switch (data.ausWork) {
    case '1-3': ausWork = 5; break;
    case '3-5': ausWork = 10; break;
    case '5-8': ausWork = 15; break;
    case '8-10': ausWork = 20; break;
  }

  let overseasWork = 0;
  switch (data.overseasWork) {
    case '3-5': overseasWork = 5; break;
    case '5-8': overseasWork = 10; break;
    case '8-10': overseasWork = 15; break;
  }

  let education = 0;
  switch (data.education) {
    case 'apprenticeship':
    case 'cert3':
    case 'diploma': education = 10; break;
    case 'bachelor': education = 15; break;
    case 'phd': education = 20; break;
  }

  const stem = data.stem ? 10 : 0;
  const ausStudy = data.ausStudy ? 5 : 0;
  const communityLanguage = data.communityLanguage ? 5 : 0;
  const professionalYear = data.professionalYear ? 5 : 0;
  const stateNomination = data.stateNomination ? 5 : 0;
  const regionalNomination = data.regionalNomination ? 15 : 0;
  const regionalStudy = data.regionalStudy ? 5 : 0;

  let partnerStatus = 0;
  switch (data.partnerStatus) {
    case 'single':
    case 'partnerSkills':
    case 'partnerCitizen': partnerStatus = 10; break;
    case 'partnerEnglish': partnerStatus = 5; break;
  }

  const total = age + english + ausWork + overseasWork + education +
    stem + ausStudy + communityLanguage + professionalYear +
    stateNomination + regionalNomination + regionalStudy + partnerStatus;

  return {
    age, english, ausWork, overseasWork, education,
    stem, ausStudy, communityLanguage, professionalYear,
    stateNomination, regionalNomination, regionalStudy,
    partnerStatus, total,
  };
}
