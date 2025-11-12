import { MembershipSuccessClient } from './MembershipSuccessClient';

export const metadata = {
  title: 'Membership Purchase Complete | Customer Portal',
  description: 'Your VIP membership purchase is complete.',
};

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function MembershipSuccessPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const sessionId = typeof params.session_id === 'string' ? params.session_id : undefined;

  return <MembershipSuccessClient sessionId={sessionId} />;
}
