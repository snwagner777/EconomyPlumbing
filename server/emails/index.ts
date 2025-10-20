import { render } from '@react-email/render';
import {
  UnsoldEstimateEmail,
  type UnsoldEstimateData,
} from './templates/UnsoldEstimateEmail';
import { WinBackEmail, type WinBackData } from './templates/WinBackEmail';
import {
  HighValueVIPEmail,
  type HighValueVIPData,
} from './templates/HighValueVIPEmail';
import {
  TechnicianConcernEmail,
  type TechnicianConcernData,
} from './templates/TechnicianConcernEmail';
import {
  AnniversaryReminderEmail,
  type AnniversaryReminderData,
} from './templates/AnniversaryReminderEmail';

export type CampaignType =
  | 'unsold_estimate'
  | 'win_back'
  | 'high_value_vip'
  | 'technician_concern'
  | 'anniversary_reminder';

export type CampaignEmailData =
  | { type: 'unsold_estimate'; data: UnsoldEstimateData }
  | { type: 'win_back'; data: WinBackData }
  | { type: 'high_value_vip'; data: HighValueVIPData }
  | { type: 'technician_concern'; data: TechnicianConcernData }
  | { type: 'anniversary_reminder'; data: AnniversaryReminderData };

export async function renderCampaignEmail(campaignData: CampaignEmailData): Promise<string> {
  switch (campaignData.type) {
    case 'unsold_estimate':
      return await render(UnsoldEstimateEmail(campaignData.data));
    case 'win_back':
      return await render(WinBackEmail(campaignData.data));
    case 'high_value_vip':
      return await render(HighValueVIPEmail(campaignData.data));
    case 'technician_concern':
      return await render(TechnicianConcernEmail(campaignData.data));
    case 'anniversary_reminder':
      return await render(AnniversaryReminderEmail(campaignData.data));
    default:
      throw new Error(`Unknown campaign type`);
  }
}

export function getCampaignSubject(campaignData: CampaignEmailData): string {
  switch (campaignData.type) {
    case 'unsold_estimate':
      return `${campaignData.data.customerFirstName}, still thinking about that ${campaignData.data.jobDescription}?`;
    case 'win_back':
      return `We Miss You, ${campaignData.data.customerFirstName}!`;
    case 'high_value_vip':
      return `${campaignData.data.customerFirstName}, Thank You for ${campaignData.data.yearsAsCustomer} Years!`;
    case 'technician_concern':
      return `${campaignData.data.customerFirstName}, Important Notice About Your ${campaignData.data.concernType}`;
    case 'anniversary_reminder':
      return `${campaignData.data.customerFirstName}, Time for a Checkup?`;
    default:
      throw new Error(`Unknown campaign type`);
  }
}

export {
  UnsoldEstimateEmail,
  WinBackEmail,
  HighValueVIPEmail,
  TechnicianConcernEmail,
  AnniversaryReminderEmail,
  type UnsoldEstimateData,
  type WinBackData,
  type HighValueVIPData,
  type TechnicianConcernData,
  type AnniversaryReminderData,
};
