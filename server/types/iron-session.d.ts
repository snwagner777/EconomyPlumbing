import 'iron-session';

declare module 'iron-session' {
  interface IronSessionData {
    portalCustomerId?: number;
    portalAvailableCustomerIds?: number[];
  }
}
