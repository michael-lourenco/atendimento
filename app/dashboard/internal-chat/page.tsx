import { redirect } from 'next/navigation';

export default function InternalChatPage() {
  redirect('/dashboard/conversations');
}
