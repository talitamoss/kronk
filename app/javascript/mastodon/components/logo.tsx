import logo from '@/images/logo.svg';
import kronkWordmark from '@/images/kronk-wordmark-small.png';

export const WordmarkLogo: React.FC = () => (
  <img src={kronkWordmark} alt='Kronk' className='logo logo--wordmark' style={{ height: '40px', width: 'auto' }} />
);

export const IconLogo: React.FC = () => (
  <svg viewBox='0 0 79 79' className='logo logo--icon' role='img'>
    <title>Kronk</title>
    <use xlinkHref='#logo-symbol-icon' />
  </svg>
);

export const SymbolLogo: React.FC = () => (
  <img src={kronkWordmark} alt='Kronk' className='logo logo--wordmark kronk-header-logo' style={{ height: '28px', width: 'auto' }} />
);
