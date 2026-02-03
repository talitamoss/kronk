import { PureComponent } from 'react';
import { FormattedMessage } from 'react-intl';
import { IconButton } from './icon_button';
import CloseIcon from '@/material-icons/400-24px/close.svg?react';
import SmartphoneIcon from '@/material-icons/400-24px/smartphone.svg?react';
import { Icon } from './icon';

const STORAGE_KEY = 'apk_install_dismissed';
const DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

class PwaInstallPrompt extends PureComponent {
  state = {
    show: false,
  };

  componentDidMount() {
    // Only show on Android
    const ua = navigator.userAgent;
    const isAndroid = /Android/.test(ua);

    if (!isAndroid) {
      return;
    }

    // Check if user dismissed recently
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10);
      if (Date.now() - dismissedTime < DISMISS_DURATION) {
        return;
      }
    }

    // Show after a short delay
    setTimeout(() => {
      this.setState({ show: true });
    }, 2000);
  }

  handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, Date.now().toString());
    this.setState({ show: false });
  };

  render() {
    const { show } = this.state;

    if (!show) {
      return null;
    }

    return (
      <div className='pwa-install-prompt'>
        <div className='pwa-install-prompt__icon'>
          <Icon id='install' icon={SmartphoneIcon} />
        </div>
        <div className='pwa-install-prompt__message'>
          <strong>
            <FormattedMessage id='pwa.install_title' defaultMessage='Get the Kronk App' />
          </strong>
          <span>
            <FormattedMessage
              id='pwa.install_message_android'
              defaultMessage='Download the app for the best experience'
            />
          </span>
        </div>
        <div className='pwa-install-prompt__actions'>
          <a
            href='https://kronk.info/kronk.apk'
            className='pwa-install-prompt__button pwa-install-prompt__button--install'
          >
            <FormattedMessage id='pwa.install_button' defaultMessage='Download' />
          </a>
          <IconButton
            icon='close'
            iconComponent={CloseIcon}
            onClick={this.handleDismiss}
            title='Dismiss'
            className='pwa-install-prompt__close'
          />
        </div>
      </div>
    );
  }
}

export default PwaInstallPrompt;
