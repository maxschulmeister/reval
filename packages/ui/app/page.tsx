import { redirect } from 'next/navigation';

export default function Home() {
  // Server-side redirect to /run which will then redirect to the latest run
  redirect('/run');
}
