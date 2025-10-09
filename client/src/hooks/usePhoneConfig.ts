interface PhoneConfig {
  display: string;
  tel: string;
}

const DEFAULT_PHONE: PhoneConfig = {
  display: '(512) 368-9159',
  tel: 'tel:+15123689159'
};

declare global {
  interface Window {
    __PHONE_CONFIG__: PhoneConfig;
  }
}

export function usePhoneConfig(): PhoneConfig {
  return window.__PHONE_CONFIG__ || DEFAULT_PHONE;
}

export function useAustinPhone(): PhoneConfig {
  return usePhoneConfig();
}

export function useMarbleFallsPhone(): PhoneConfig {
  return {
    display: '(830) 460-3565',
    tel: 'tel:+18304603565'
  };
}
