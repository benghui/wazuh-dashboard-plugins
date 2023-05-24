import { RegisterAgentData } from '../interfaces/types';
import LinuxIcon from '../../../../public/assets/images/icons/linux-icon.svg';
import WindowsIcon from '../../../../public/assets/images/icons/windows-icon.svg';
import MacIcon from '../../../../public/assets/images/icons/mac-icon.svg';

export const REGISTER_AGENT_DATA_STEP_ONE: RegisterAgentData[] = [
  {
    icon: LinuxIcon,
    title: 'LINUX',
    hr: true,
    architecture: ['RPM amd64', 'RPM aarch64', 'DEB amd64', 'DEB aarch64'],
  },
  {
    icon: WindowsIcon,
    title: 'WINDOWS',
    hr: true,
    architecture: ['MSI 32/64'],
  },
  {
    icon: MacIcon,
    title: 'macOS',
    hr: true,
    architecture: ['PKG 32/64 AMB64'],
  },
  // {
  //   callout:
  //     'For additional systems and architectures, please check our Wazuh agent installation guide.',
  // },
];

export const REGISTER_AGENT_DATA_STEP_TWO = [
  {
    title: 'Server address',
    subtitle:
      'This is the address the agent uses to communicate with the Wazuh server. Enter an IP address or a fully qualified domain name (FDQN).',
    inputText: true,
  },
];