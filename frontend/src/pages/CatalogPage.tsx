import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, type Catalog } from '../api';
import { useAuth } from '../auth';
import { Button, PageTitle, Panel } from '../components/ui';
import { duration, euro, SALON_PHONE } from '../format';

/**
 * Javni cenik za gosta in stranko: storitve s trajanjem in ceno ter frizerji
 * (vloga Gost v 02-funkcionalnosti-in-obseg.md; US-04 kriterij 3, US-07 kriterij 6).
 */
export default function CatalogPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [catalog, setCatalog] = useState<Catalog | null>(null);

  useEffect(() => {
    api.get<Catalog>('/services/catalog').then(setCatalog);
  }, []);

  return (
    <div>
      <PageTitle actions={<Button variant="primary" onClick={() => navigate('/booking')}>Prosti termini</Button>}>
        Cenik
      </PageTitle>
      <p className="-mt-4 mb-6 text-muted">
        Frizerski salon Salonko · telefon {SALON_PHONE}
        {!user && ' · Proste termine si lahko ogledate brez prijave, za rezervacijo pa potrebujete račun.'}
      </p>

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_22rem]">
        <Panel title="Storitve">
          <table className="w-full text-left">
            <thead className="cap">
              <tr>
                <th className="py-2">Storitev</th>
                <th>Trajanje</th>
                <th>Cena</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {catalog?.services.map((s) => (
                <tr key={s.id} className="border-t border-line align-top">
                  <td className="py-3 pr-4">
                    <div className="font-medium">{s.name}</div>
                    {s.description && <div className="text-sm text-muted">{s.description}</div>}
                    <div className="text-sm text-muted">
                      {s.hairdressers.length ? `Opravlja: ${s.hairdressers.join(', ')}` : 'Trenutno je ne opravlja noben frizer.'}
                    </div>
                  </td>
                  <td className="py-3 pr-4 font-mono text-sm whitespace-nowrap">{duration(s.durationMin)}</td>
                  <td className="py-3 pr-4 font-mono text-sm whitespace-nowrap">{euro(s.price)}</td>
                  <td className="py-3 text-right">
                    <Button small disabled={s.hairdressers.length === 0} onClick={() => navigate(`/booking?service=${s.id}`)}>
                      Izberi termin
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <Panel title="Frizerji">
          <ul className="divide-y divide-line">
            {catalog?.hairdressers.map((h) => (
              <li key={h.id} className="py-3">
                <div className="font-medium">{h.name}</div>
                <div className="text-sm text-muted">{h.services.join(', ') || '—'}</div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
