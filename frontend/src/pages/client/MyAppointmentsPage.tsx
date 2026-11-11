import { useEffect, useState, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api, ApiError, type Appointment } from '../../api';
import { Alert, Button, Note, PageTitle, Panel, StatusPill, type Message } from '../../components/ui';
import { dateShort, euro, SALON_PHONE, time } from '../../format';

/** WF-03: moji termini, preklic in prestavitev (US-09); razlog preklica s strani frizerja (US-10, kriterij 3). */
export default function MyAppointmentsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [cancelling, setCancelling] = useState<Appointment | null>(null);
  const [message, setMessage] = useState<Message>(
    location.state?.message ? { kind: 'ok', text: location.state.message } : null,
  );

  const load = () => api.get<Appointment[]>('/appointments/mine').then(setAppointments);
  useEffect(() => {
    load();
  }, []);

  const now = Date.now();
  const upcoming = appointments
    .filter((a) => a.status === 'CONFIRMED' && new Date(a.endsAt).getTime() > now)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const history = appointments.filter((a) => !upcoming.includes(a));

  async function confirmCancel() {
    if (!cancelling) return;
    try {
      await api.post(`/appointments/${cancelling.id}/cancel`);
      setMessage({ kind: 'ok', text: 'Termin je preklican. Čas je spet na voljo drugim strankam.' });
    } catch (err) {
      setMessage({ kind: 'bad', text: err instanceof ApiError ? err.message : 'Preklic ni uspel' });
    }
    setCancelling(null);
    load();
  }

  return (
    <div>
      <PageTitle actions={<Button variant="primary" onClick={() => navigate('/booking')}>+ Nova rezervacija</Button>}>
        Moji termini
      </PageTitle>

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-5">
          {message && <Alert kind={message.kind}>{message.text}</Alert>}

          <Panel title="Prihodnji">
            {upcoming.length === 0 ? (
              <p className="text-muted">Nimate prihodnjih terminov.</p>
            ) : (
              <ul className="divide-y divide-line">
                {upcoming.map((a) => (
                  <Row key={a.id} a={a}>
                    {a.canChange ? (
                      <div className="flex gap-2">
                        <Button onClick={() => navigate(`/booking?reschedule=${a.id}`)}>Prestavi</Button>
                        <Button variant="danger" onClick={() => setCancelling(a)}>
                          Prekliči
                        </Button>
                      </div>
                    ) : (
                      <Note>
                        Spletne spremembe so zaprte 24 ur prej.
                        <br />
                        Pokličite salon: {SALON_PHONE}
                      </Note>
                    )}
                  </Row>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Zgodovina">
            {history.length === 0 ? (
              <p className="text-muted">Ni preteklih terminov.</p>
            ) : (
              <ul className="divide-y divide-line">
                {history.map((a) => (
                  <Row key={a.id} a={a} />
                ))}
              </ul>
            )}
          </Panel>
        </div>

        {cancelling && (
          <Panel title="Preklic termina?" className="lg:sticky lg:top-6">
            <p>
              {cancelling.serviceName}
              <br />
              {dateShort(cancelling.startsAt)}, ob {time(cancelling.startsAt)} · {cancelling.hairdresserName}
            </p>
            <div className="mt-4 flex gap-2">
              <Button variant="primary" onClick={confirmCancel}>
                Da, prekliči
              </Button>
              <Button onClick={() => setCancelling(null)}>Obdrži</Button>
            </div>
            <p className="mt-3 text-sm text-muted">Čas se sprosti za druge stranke.</p>
          </Panel>
        )}
      </div>
    </div>
  );
}

function Row({ a, children }: { a: Appointment; children?: ReactNode }) {
  const details = [a.hairdresserName, euro(a.price)];
  if (a.clientNote) details.push(`»${a.clientNote}«`);
  if (a.status === 'CANCELLED' && a.cancellationReason) details.push(`Razlog preklica: ${a.cancellationReason}`);

  return (
    <li className="flex flex-wrap items-center gap-x-6 gap-y-3 py-4">
      <div className="w-32 shrink-0">
        <div>{dateShort(a.startsAt)}</div>
        <div className="font-mono text-sm text-muted">
          {time(a.startsAt)}–{time(a.endsAt)}
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{a.serviceName}</span>
          <StatusPill status={a.status} />
        </div>
        <div className="text-sm text-muted">{details.join(' · ')}</div>
      </div>
      {children && <div className="ml-auto">{children}</div>}
    </li>
  );
}
