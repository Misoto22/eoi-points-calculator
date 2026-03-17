'use client';

import { useTranslation } from 'react-i18next';
import { invitationRounds } from '@/data/invitationRounds';
import CollapsibleSection from './CollapsibleSection';

interface Props {
  totalPoints: number;
}

export default function InvitationRounds({ totalPoints }: Props) {
  const { t } = useTranslation();

  return (
    <CollapsibleSection title={t('rounds.title')}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr
              className="text-xs uppercase tracking-wide"
              style={{ color: 'var(--text-tertiary)' }}
            >
              <th className="text-left py-2 font-medium">{t('rounds.date')}</th>
              <th className="text-left py-2 font-medium">{t('rounds.visa')}</th>
              <th className="text-right py-2 font-medium">{t('rounds.minimumPoints')}</th>
              <th className="text-right py-2 font-medium">{t('rounds.invitations')}</th>
              <th className="text-right py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {invitationRounds.map((round, i) => {
              const qualified = totalPoints >= round.minimumPoints;
              return (
                <tr
                  key={`${round.date}-${round.visa}`}
                  className="border-t"
                  style={{ borderColor: 'var(--border-primary)' }}
                >
                  <td className="py-2" style={{ color: 'var(--text-primary)' }}>{round.date}</td>
                  <td className="py-2" style={{ color: 'var(--text-secondary)' }}>{round.visa}</td>
                  <td className="py-2 text-right tabular-nums" style={{ color: 'var(--text-primary)' }}>
                    {round.minimumPoints}
                  </td>
                  <td className="py-2 text-right tabular-nums" style={{ color: 'var(--text-secondary)' }}>
                    {round.invitations.toLocaleString()}
                  </td>
                  <td className="py-2 text-right">
                    <span
                      className="inline-block w-2 h-2 rounded-full"
                      style={{ backgroundColor: qualified ? 'var(--accent)' : 'var(--border-primary)' }}
                      title={qualified ? t('rounds.qualified') : t('rounds.notQualified')}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </CollapsibleSection>
  );
}
