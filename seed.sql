-- Seed: SparkMind ecosystem sub-brands under OBP Merchant-of-Record
INSERT OR IGNORE INTO sub_brands (id, prefix, name, domain, webhook_url, webhook_secret, mor_fee_bps) VALUES
  ('barberkas', 'BK', 'BarberKas',  'barberkas.sparkmind.web.id',  'https://barberkas.sparkmind.web.id/webhooks/obp',  'whsec_barberkas_demo',  100),
  ('kuratorkas','KK', 'KuratorKas', 'kuratorkas.sparkmind.web.id', 'https://kuratorkas.sparkmind.web.id/webhooks/obp', 'whsec_kuratorkas_demo', 100),
  ('pacelokal', 'PL', 'PaceLokal',  'pacelokal.sparkmind.web.id',  'https://pacelokal.sparkmind.web.id/webhooks/obp',  'whsec_pacelokal_demo',  100),
  ('nuranios',  'NO', 'Nurani.OS',  'nuranios.sparkmind.web.id',   'https://nuranios.sparkmind.web.id/webhooks/obp',   'whsec_nuranios_demo',   100),
  ('momentkas', 'MK', 'MomentKas',  'momentkas.sparkmind.web.id',  'https://momentkas.sparkmind.web.id/webhooks/obp',  'whsec_momentkas_demo',  100),
  ('petung',    'PF', 'Petung Foundry', 'petung.sparkmind.web.id',  'https://petung.sparkmind.web.id/webhooks/obp',     'whsec_petung_demo',     100);
