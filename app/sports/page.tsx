import SportsClient from './SportsClient';

export const revalidate = 10; // revalidate every 10 seconds in the background

export default async function SportsPage() {
  let initialMatches = [];
  try {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://casanova-backend.onrender.com/api/v1';
    const res = await fetch(`${API_URL}/games/matches`, { next: { revalidate: 10 } });
    if (res.ok) {
      const data = await res.json();
      initialMatches = data.data || [];
    }
  } catch (error) {
    console.error('Failed to prefetch matches:', error);
  }

  return (
    <SportsClient initialMatches={initialMatches} />
  );
}
