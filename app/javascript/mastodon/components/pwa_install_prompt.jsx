import { PureComponent } from 'react';
import { FormattedMessage } from 'react-intl';
import { IconButton } from './icon_button';
import CloseIcon from '@/material-icons/400-24px/close.svg?react';
import SmartphoneIcon from '@/material-icons/400-24px/smartphone.svg?react';
import { Icon } from './icon';

const STORAGE_KEY = 'pwa_install_dismissed';
const DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

class PwaInstallPrompt extends PureComponent {
  state = {
    show: false,
    deferredPrompt: null,
    installing: false,
    isIOS: false,
    isAndroid: false,
  };

  componentDidMount() {
    // Check if already installed (standalone mode)
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
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

    // Detect platform
    const ua = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
    const isAndroid = /Android/.test(ua);

    // Listen for the install prompt event
    window.addEventListener('beforeinstallprompt', this.handleBeforeInstallPrompt);

    if (isIOS) {
      // Show iOS-specific prompt after a delay
      setTimeout(() => {
        this.setState({ show: true, isIOS: true });
      }, 2000);
    } else {
      // For Android/desktop, show after delay
      this.setState({ isAndroid });
      setTimeout(() => {
        if (!this.state.show) {
          this.setState({ show: true });
        }
      }, 3000);
    }
  }

  componentWillUnmount() {
    window.removeEventListener('beforeinstallprompt', this.handleBeforeInstallPrompt);
  }

  handleBeforeInstallPrompt = (e) => {
    e.preventDefault();
    this.setState({
      deferredPrompt: e,
      show: true,
    });
  };

  handleInstall = async () => {
    const { deferredPrompt } = this.state;

    if (!deferredPrompt) {
      return;
    }

    this.setState({ installing: true });
    deferredPrompt.prompt();

    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      this.setState({ show: false });
    } else {
      this.handleDismiss();
    }

    this.setState({ deferredPrompt: null, installing: false });
  };

  handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, Date.now().toString());
    this.setState({ show: false });
  };

  render() {
    const { show, installing, isIOS, isAndroid, deferredPrompt } = this.state;

    if (!show) {
      return null;
    }

    // Determine what message and action to show
    let message;
    let showInstallButton = false;

    if (isIOS) {
      message = (
        <FormattedMessage
          id='pwa.install_message_ios'
          defaultMessage='Tap {shareIcon} then Add to Home Screen'
          values={{ shareIcon: <strong>Share</strong> }}
        />
      );
    } else if (deferredPrompt) {
      message = (
        <FormattedMessage
          id='pwa.install_message'
          defaultMessage='Install for the best experience'
        />
      );
      showInstallButton = true;
    } else if (isAndroid) {
      message = (
        <FormattedMessage
          id='pwa.install_message_android'
          defaultMessage='Tap menu ⋮ then Add to Home screen'
        />
      );
    } else {
      message = (
        <FormattedMessage
          id='pwa.install_message_desktop'
          defaultMessage='Install from your browser menu'
        />
      );
    }

    return (
      <div className='pwa-install-prompt'>
        <div className='pwa-install-prompt__icon'>
          <Icon id='install' icon={SmartphoneIcon} />
        </div>
        <div className='pwa-install-prompt__message'>
          <strong>
            <FormattedMessage id='pwa.install_title' defaultMessage='Install Kronk' />
          </strong>
          <span>{message}</span>
        </div>
        <div className='pwa-install-prompt__actions'>
          {showInstallButton && (
            <button
              className='pwa-install-prompt__button pwa-install-prompt__button--install'
              onClick={this.handleInstall}
              disabled={installing}
            >
              <FormattedMessage id='pwa.install_button' defaultMessage='Install' />
            </button>
          )}
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
