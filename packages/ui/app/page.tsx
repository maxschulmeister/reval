import { redirect } from 'next/navigation';

export default function Home() {
  // Server-side redirect to /eval which will then redirect to the latest eval
redirect('/eval');
}
