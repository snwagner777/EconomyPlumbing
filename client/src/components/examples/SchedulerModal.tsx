import { useState } from 'react';
import SchedulerModal from '../SchedulerModal';

export default function SchedulerModalExample() {
  const [open, setOpen] = useState(true);
  return <SchedulerModal open={open} onOpenChange={setOpen} />;
}
