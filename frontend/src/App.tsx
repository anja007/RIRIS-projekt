import { useEffect, useState } from 'react';

export default function App() {
  const [status, setStatus] = useState('preverjam ...');

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => setStatus(data.status))
      .catch(() => setStatus('zaledje ni dosegljivo'));
  }, []);

  return (
    <main className="mx-auto max-w-xl p-8">
      <h1 className="text-3xl font-semibold">Salonko</h1>
      <p className="mt-2 text-gray-600">Stanje zaledja: {status}</p>
    </main>
  );
}
