import { describe, it, expect } from 'vitest';
import { parseBestillingEdit, bestillingFormDefaults, NEW_ORDER_FIELD_DEFAULTS } from '@/lib/edit-order';
import { buildProduct } from '@/lib/manual-order';

const NAA = '2026-08-17T12:00:00.000Z';
const REDIGERER = 'joakim@roverk.no';

const SKJUL_FELT = {
  skjul_count: '4',
  skjul_serie: 'Standard',
  skjul_kledning: 'royal',
  skjul_montering: 'on',
};

describe('parseBestillingEdit', () => {
  it('skjul: endret kledning gir buildProduct-nøkler, bevarer app-nøkler og setter redigert_*', () => {
    const order = {
      site: 'skjul',
      price_nok: 45_000,
      config: {
        count: 4,
        serie: 'Standard',
        kledning: 'ubeh',
        montering: true,
        forankring: false,
        manuell: true,
        kanal: 'Telefon',
        registrert_av: 'gammel@roverk.no',
        leftover: 'skal-droppes',
      },
    };
    const r = parseBestillingEdit(order, SKJUL_FELT, REDIGERER, NAA);
    expect(r.ok).toBe(true);
    if (!r.ok) return;

    const built = buildProduct('skjul', SKJUL_FELT);
    expect('error' in built).toBe(false);
    if ('error' in built) return;

    expect(r.data.product).toBe(built.productText);
    expect(r.data.product).toBe('4-dunk Standard');
    for (const [k, v] of Object.entries(built.config)) {
      expect(r.data.config[k]).toEqual(v);
    }
    expect(r.data.config.kledning).toBe('royal');
    expect(r.data.config.manuell).toBe(true);
    expect(r.data.config.kanal).toBe('Telefon');
    expect(r.data.config.registrert_av).toBe('gammel@roverk.no');
    expect(r.data.config.redigert_av).toBe(REDIGERER);
    expect(r.data.config.redigert_kl).toBe(NAA);
    expect(r.data.config).not.toHaveProperty('leftover');
  });

  it('ved: gyldig modell gir size + produkttekst', () => {
    const r = parseBestillingEdit(
      { site: 'ved', config: {}, price_nok: null },
      { ved_modell: 'Stor' },
      REDIGERER,
      NAA,
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.config.navn).toBe('Stor');
    expect(r.data.config.size).toBe('stor');
    expect(r.data.product).toBe('Vedskjul Stor');
  });

  it('orden: gyldige mål, avviser w/h utenfor 1–5 / 3–7', () => {
    const order = { site: 'orden', config: {}, price_nok: null };
    const ok = parseBestillingEdit(
      order,
      { orden_bt: '100L', orden_w: '3', orden_h: '5', orden_hjul: 'on' },
      REDIGERER,
      NAA,
    );
    expect(ok.ok).toBe(true);
    if (ok.ok) {
      expect(ok.data.config).toMatchObject({ bt: '100L', w: 3, h: 5, withWheels: true });
      expect(ok.data.product).toBe('Orden 100L · 3×5');
    }
    expect(parseBestillingEdit(order, { orden_w: '9', orden_h: '5' }, REDIGERER, NAA).ok).toBe(false);
    expect(parseBestillingEdit(order, { orden_w: '3', orden_h: '2' }, REDIGERER, NAA).ok).toBe(false);
  });

  it('orden-v2: bruker orden-skjema, uten å kreve at site skrives om', () => {
    const r = parseBestillingEdit(
      { site: 'orden-v2', config: { manuell: true, kanal: 'E-post' }, price_nok: null },
      { orden_bt: '60L', orden_w: '2', orden_h: '4' },
      REDIGERER,
      NAA,
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.product).toBe('Orden 60L · 2×4');
    expect(r.data.config.bt).toBe('60L');
    expect(r.data.config.manuell).toBe(true);
  });

  it('kanal ignoreres på nettsideordre og tas inn på manuell ordre', () => {
    const nettside = parseBestillingEdit(
      { site: 'ved', config: { navn: 'Medium', size: 'medium' }, price_nok: null },
      { ved_modell: 'Medium', kanal: 'Telefon' },
      REDIGERER,
      NAA,
    );
    expect(nettside.ok).toBe(true);
    if (nettside.ok) {
      expect(nettside.data.config).not.toHaveProperty('kanal');
      expect(nettside.data.config).not.toHaveProperty('manuell');
    }

    const manuell = parseBestillingEdit(
      {
        site: 'ved',
        config: { manuell: true, kanal: 'E-post', registrert_av: 'gammel@roverk.no' },
        price_nok: null,
      },
      { ved_modell: 'Stor', kanal: 'Instagram' },
      REDIGERER,
      NAA,
    );
    expect(manuell.ok).toBe(true);
    if (manuell.ok) {
      expect(manuell.data.config.kanal).toBe('Instagram');
      expect(manuell.data.config.manuell).toBe(true);
    }

    const ugyldigKanal = parseBestillingEdit(
      { site: 'ved', config: { manuell: true, kanal: 'E-post' }, price_nok: null },
      { ved_modell: 'Medium', kanal: 'Brevdue' },
      REDIGERER,
      NAA,
    );
    expect(ugyldigKanal.ok && ugyldigKanal.data.config.kanal).toBe('E-post');
  });

  it('pris: tomt felt → null, «12 500» → 12500, negativt → feil', () => {
    const order = { site: 'ved', config: {}, price_nok: 64_900 };
    const tom = parseBestillingEdit(order, { ved_modell: 'Medium', price_nok: '' }, REDIGERER, NAA);
    expect(tom.ok && tom.data.price_nok).toBeNull();

    const mellomrom = parseBestillingEdit(
      order,
      { ved_modell: 'Medium', price_nok: '12 500' },
      REDIGERER,
      NAA,
    );
    expect(mellomrom.ok && mellomrom.data.price_nok).toBe(12_500);

    const negativ = parseBestillingEdit(
      order,
      { ved_modell: 'Medium', price_nok: '-1' },
      REDIGERER,
      NAA,
    );
    expect(negativ.ok).toBe(false);
  });

  it('ukjent site → { ok: false } uten å kaste', () => {
    expect(() =>
      parseBestillingEdit({ site: 'tull', config: {}, price_nok: null }, {}, REDIGERER, NAA),
    ).not.toThrow();
    const r = parseBestillingEdit({ site: 'tull', config: {}, price_nok: null }, {}, REDIGERER, NAA);
    expect(r.ok).toBe(false);
  });

  it('egendefinert product-felt ignoreres – alltid productText', () => {
    const r = parseBestillingEdit(
      { site: 'ved', config: {}, price_nok: null },
      { ved_modell: 'Medium', product: 'Spesial dobbel' },
      REDIGERER,
      NAA,
    );
    expect(r.ok && r.data.product).toBe('Vedskjul Medium');
  });
});

describe('bestillingFormDefaults', () => {
  it('skjul: mapper config til skjemafelter som parseBestillingEdit forstår', () => {
    const config = {
      count: 6,
      serie: 'XL',
      kledning: 'royal',
      montering: false,
      forankring: true,
    };
    const defaults = bestillingFormDefaults('skjul', config);
    expect(defaults).toEqual({
      ...NEW_ORDER_FIELD_DEFAULTS,
      skjul_count: '6',
      skjul_serie: 'XL',
      skjul_kledning: 'royal',
      skjul_montering: false,
      skjul_forankring: true,
    });

    const fields: Record<string, string> = {
      skjul_count: defaults!.skjul_count,
      skjul_serie: defaults!.skjul_serie,
      skjul_kledning: defaults!.skjul_kledning,
    };
    if (defaults!.skjul_forankring) fields.skjul_forankring = 'on';
    const r = parseBestillingEdit({ site: 'skjul', config, price_nok: null }, fields, REDIGERER, NAA);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.product).toBe('6-dunk XL');
    expect(r.data.config).toMatchObject(config);
  });

  it('ukjent site → null (skjemaet skal ikke vises)', () => {
    expect(bestillingFormDefaults('tull', { count: 4 })).toBeNull();
  });

  it('manglende nøkler faller tilbake til NewOrder-defaults', () => {
    expect(bestillingFormDefaults('skjul', {})).toMatchObject({
      skjul_count: '4',
      skjul_serie: 'Standard',
      skjul_kledning: 'ubeh',
      skjul_montering: true,
      skjul_forankring: false,
    });
    expect(bestillingFormDefaults('ved', {})?.ved_modell).toBe('Medium');
    expect(bestillingFormDefaults('orden', {})).toMatchObject({
      orden_bt: '60L',
      orden_w: '3',
      orden_h: '4',
      orden_hjul: false,
    });
  });

  it('orden-v2 bruker Orden-felter (bt/w/h/withWheels)', () => {
    const defaults = bestillingFormDefaults('orden-v2', {
      bt: '100L',
      w: 2,
      h: 5,
      withWheels: true,
    });
    expect(defaults).toMatchObject({
      orden_bt: '100L',
      orden_w: '2',
      orden_h: '5',
      orden_hjul: true,
    });
  });

  it('ugyldig kledning/navn faller tilbake, ikke gjennom som råverdi', () => {
    expect(bestillingFormDefaults('skjul', { kledning: 'beis' })?.skjul_kledning).toBe('ubeh');
    expect(bestillingFormDefaults('ved', { navn: 'Spesial' })?.ved_modell).toBe('Medium');
  });

  it('ved: size brukes når navn mangler', () => {
    expect(bestillingFormDefaults('ved', { size: 'stor' })?.ved_modell).toBe('Stor');
  });
});
