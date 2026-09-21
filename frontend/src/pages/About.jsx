import { Result } from 'antd';

import useLanguage from '@/locale/useLanguage';

const About = () => {
  const translate = useLanguage();
  return (
    <Result
      status="info"
      title={'IDURAR'}
      subTitle={translate('Open source ERP CRM for invoices, quotes and payments')}
      extra={
        <p>
          A modified fork of IDURAR ERP CRM, licensed under AGPL-3.0.{' '}
          <a href="https://github.com/kdave47/project-erp-crm">Source</a>
        </p>
      }
    />
  );
};

export default About;
