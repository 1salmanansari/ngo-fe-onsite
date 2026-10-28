'use client';

import React from 'react';
import { RegistrationModule } from '../components/registration/RegistrationModule';
import { VitalsModule } from '../components/vitals/VitalsModule';
import { ProfileModule } from '../components/profile/ProfileModule';
import { ReferralModule } from '../components/referral/ReferralModule';
import { TestsModule } from '../components/tests/TestsModule';
import { MedsModule } from '../components/meds/MedsModule';
import { useSubdomain } from '../contexts/SubdomainContext';
import { Department } from '../types';

interface OnsiteClientAppProps {
  initialDepartments: Department[];
}

export const OnsiteClientApp: React.FC<OnsiteClientAppProps> = ({ initialDepartments }) => {
  const { subdomain } = useSubdomain();

  switch (subdomain) {
    case 'vitals':
      return <VitalsModule />;
    case 'profile':
      return <ProfileModule />;
    case 'referral':
      return <ReferralModule />;
    case 'tests':
      return <TestsModule />;
    case 'meds':
      return <MedsModule />;
    case 'register':
    default:
      return <RegistrationModule initialDepartments={initialDepartments} />;
  }
};
