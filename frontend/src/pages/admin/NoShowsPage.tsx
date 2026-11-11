import { useEffect, useState } from 'react';
import { api, ApiError, type NoShow } from '../../api';
import { Alert, Button, PageTitle, Panel, type Message } from '../../components/ui';
import { dateLong, time } from '../../format';

/** Popravek neprihoda v zaključen termin; to lahko naredi samo administrator (US-11, kriterij 4). */
export default function NoShowsPage() {
  const [list, setList] = useState<NoShow[]>([]);
  const [message, setMessage] = useState<Message>(null);

  const load = () => api.get<NoShow[]>('/admin/appointments/no-shows').then(setList);
  useEffect(() => {
    load();
  }, []);

  async function correct(n: NoShow) {
    if (!window.confirm(`Popravim neprihod (${n.clientName}, ${dateLong(n.startsAt)}) v zaključen termin?`)) return;
    try {
      await api.post(`/admin/appointments/${n.id}/mark-completed`);
      setMessage({ kind: 'ok', text: 'Termin je popravljen v zaključen, število neprihodov je zmanjšano.' });
    } catch (err) {
      setMessage({ kind: 'bad', text: err instanceof ApiError ? err.message : 'Popravek ni uspel' });
    }
    load();
  }

  return (
    <div className="space-y-6">
      <PageTitle>Neprihodi</PageTitle>
      <p className="-mt-4 text-sm text-muted">Neprihod, ki ga je frizer označil po pomoti, lahko popravi samo administrator.</p>
      {message && <Alert kind={message.kind}>{message.text}</Alert>}
      <Panel>
        {list.length === 0 ? (
          <p className="text-muted">Ni terminov z neprihodom.</p>
        ) : (
          <table className="w-full text-left">
            <thead className="cap">
              <tr>
                <th className="py-2">Termin</th>
                <th>Stranka</th>
                <th>Neprihodi skupaj</th>
                <th>Storitev</th>
                <th>Frizer</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {list.map((n) => (
                <tr key={n.id} className="border-t border-line">
                  <td className="py-3">
                    {dateLong(n.startsAt)} {time(n.startsAt)}
                  </td>
                  <td>
                    {n.clientName}
                    <div className="text-sm text-muted">{n.clientPhone}</div>
                  </td>
                  <td>{n.noShowCount}</td>
                  <td>{n.serviceName}</td>
                  <td>{n.hairdresserName}</td>
                  <td className="text-right">
                    <Button small variant="ok" onClick={() => correct(n)}>
                      Popravi v zaključen
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>
    </div>
  );
}
