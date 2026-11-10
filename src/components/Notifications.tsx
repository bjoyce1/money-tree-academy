import { Toaster } from '@/components/ui/toaster';
import { RewardToasts } from './RewardToasts';

/** Toasts for unlocked achievements; loaded after the first paint. */
export default function Notifications() {
  return (
    <>
      <Toaster />
      <RewardToasts />
    </>
  );
}
