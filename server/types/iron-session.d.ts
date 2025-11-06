import 'iron-session';

declare module 'iron-session' {
  interface IronSessionData {
    customerId?: number;
    availableCustomerIds?: number[];
  }
}
