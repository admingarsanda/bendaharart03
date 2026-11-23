'use strict';
/* =====================================================================
   BENDAHARA RT — front-end (HTML/CSS/JS) + database Google Sheets
   Isi DEFAULT_API_URL dengan URL Web App Apps Script agar langsung
   terhubung, atau isi lewat layar login (disimpan di perangkat).
   ===================================================================== */
const DEFAULT_API_URL = '';

/* ---------- Utilitas ---------- */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const rp = (n) => 'Rp' + Math.round(+n || 0).toLocaleString('id-ID');
const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const periodeLabel = (p) => BULAN[+p.slice(5, 7) - 1] + ' ' + p.slice(0, 4);
const today = () => {
  const d = new Date();
  return new Date(d - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};
const shiftP = (p, d) => {
  let y = +p.slice(0, 4),
    m = +p.slice(5, 7) - 1 + d;
  y += Math.floor(m / 12);
  m = ((m % 12) + 12) % 12;
  return y + '-' + String(m + 1).padStart(2, '0');
};
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const tglIndo = (t) => {
  if (!t) return '';
  const [y, m, d] = String(t).slice(0, 10).split('-');
  return `${+d} ${BULAN[+m - 1]} ${y}`;
};
const sum = (a, f) => a.reduce((t, x) => t + (+f(x) || 0), 0);

const ICON = {
  home: '<path d="M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
  bill: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h8"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"/><circle cx="17.5" cy="9" r="2.5"/><path d="M17 14c2.8 0 4.5 1.8 4.5 4.5"/>',
  heart: '<path d="M12 21s-8-5.3-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.7-8 11-8 11z"/>',
  wallet: '<rect x="3" y="6" width="18" height="14" rx="3"/><path d="M3 10h18M16 15h2"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  printer: '<path d="M6 9V3h12v6M6 18H4v-7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v7h-2"/><rect x="6" y="14" width="12" height="7"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
  sync: '<path d="M21 12a9 9 0 0 1-15.5 6.2M3 12A9 9 0 0 1 18.5 5.8M18 2v4h-4M6 22v-4h4"/>',
  wa: '<path d="M21 12a9 9 0 0 1-13.4 7.8L3 21l1.3-4.4A9 9 0 1 1 21 12z"/>',
};
const ico = (n) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICON[n]}</svg>`;

/* ---------- Definisi iuran ---------- */
const POS = [
  ['kas_rw', 'Kas RW'],
  ['kas_rt', 'Kas RT'],
  ['koperasi', 'Koperasi'],
  ['arisan', 'Arisan'],
  ['pembangunan', 'Pembangunan'],
  ['lingkungan', 'Lingkungan'],
  ['tali_asih', 'Tali Asih'],
  ['lain', 'Tagihan Lainnya'],
];
const posLabel = (k) => (POS.find((p) => p[0] === k) || [])[1] || k;
const posGroup = (p) => (String(p).startsWith('tali_') ? 'tali_asih' : p);

const DEFAULT_TARIF = [
  ['kas_rw', 'Kas RW', 8000],
  ['kas_rt', 'Kas RT', 16000],
  ['koperasi', 'Koperasi (anggota)', 4000],
  ['arisan', 'Arisan (anggota)', 10000],
  ['pembangunan_1', 'Pembangunan - Kategori 1', 6000],
  ['pembangunan_2', 'Pembangunan - Kategori 2', 3500],
  ['pembangunan_3', 'Pembangunan - Kategori 3', 2500],
  ['lingkungan_1', 'Lingkungan - Kategori 1', 10000],
  ['lingkungan_2', 'Lingkungan - Kategori 2', 5000],
  ['lingkungan_3', 'Lingkungan - Kategori 3', 0],
  ['tali_kematian', 'Tali Asih - Kematian', 10000],
  ['tali_sakit', 'Tali Asih - Sakit', 5000],
].map(([id, label, nominal]) => ({ id, label, nominal }));
const DEFAULT_SETTING = [
  ['nama_rt', 'RT 00 / RW 00'],
  ['kelurahan', 'Kelurahan ...'],
  ['bendahara', ''],
  ['jatuh_tempo', 'Setiap tanggal 10'],
  ['info_bayar', 'Bayar tunai ke Bendahara atau transfer ke rekening ...'],
].map(([id, nilai]) => ({ id, nilai }));
const SHEETS = ['Warga', 'Tarif', 'Kejadian', 'Pembayaran', 'KasRT', 'Tambahan', 'Pengaturan'];

/* ---------- State ---------- */
const S = {
  page: 'home',
  periode: today().slice(0, 7),
  D: {},
  pidx: {},
  q: '',
  filter: 'all',
  kasFilter: today().slice(0, 7),
  cetak: { target: 'all', wid: '', ar: true, size: '2' },
};
const CFG = { url: '', pin: '', demo: false };

/* ---------- Lapisan data ---------- */
const Demo = {
  get() {
    let d = null;
    try {
      d = JSON.parse(localStorage.getItem('rt_demo'));
    } catch (e) {}
    if (!d) {
      d = {
        Warga: [
          { id: 'w1', nama: 'Budi Santoso', alamat: 'Blok A No. 1', hp: '081234567801', pembangunan: '1', lingkungan: '1', koperasi: 'Ya', arisan: 'Ya', mulai: '', status: 'Aktif' },
          { id: 'w2', nama: 'Siti Aminah', alamat: 'Blok A No. 2', hp: '081234567802', pembangunan: '2', lingkungan: '2', koperasi: 'Tidak', arisan: 'Ya', mulai: '', status: 'Aktif' },
          { id: 'w3', nama: 'Agus Wijaya', alamat: 'Blok B No. 5', hp: '', pembangunan: '1', lingkungan: '2', koperasi: 'Ya', arisan: 'Tidak', mulai: '', status: 'Aktif' },
        ],
        Tarif: DEFAULT_TARIF,
        Kejadian: [],
        Pembayaran: [],
        KasRT: [],
        Tambahan: [],
        Pengaturan: DEFAULT_SETTING,
      };
      this.put(d);
    }
    SHEETS.forEach((k) => {
      if (!d[k]) d[k] = [];
    });
    return d;
  },
  put(d) {
    localStorage.setItem('rt_demo', JSON.stringify(d));
  },
  async call(req) {
    const d = this.get();
    if (req.action === 'getAll') return { ok: true, data: d };
    if (req.action === 'upsert') {
      req.rows.forEach((r) => {
        const i = d[req.sheet].findIndex((x) => String(x.id) === String(r.id));
        i >= 0 ? (d[req.sheet][i] = r) : d[req.sheet].push(r);
      });
      this.put(d);
      return { ok: true };
    }
    if (req.action === 'remove') {
      d[req.sheet] = d[req.sheet].filter((x) => !req.ids.includes(String(x.id)));
      this.put(d);
      return { ok: true };
    }
    if (req.action === 'changePin') return { ok: true };
    return { ok: false, error: 'Aksi tidak dikenal' };
  },
};
async function remote(payload) {
  const res = await fetch(CFG.url, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ ...payload, pin: CFG.pin }) });
  const j = await res.json();
  if (!j.ok) throw new Error(j.error || 'Terjadi kesalahan');
  return j;
}
const api = (payload) => (CFG.demo ? Demo.call(payload) : remote(payload));

function normalize(d) {
  SHEETS.forEach((s) => {
    d[s] = (d[s] || []).map((r) => {
      const o = {};
      for (const k in r) o[k] = r[k] === null || r[k] === undefined ? '' : r[k];
      return o;
    });
  });
  const num = (arr, f) =>
    arr.forEach((r) => {
      r[f] = +r[f] || 0;
    });
  num(d.Tarif, 'nominal');
  num(d.Kejadian, 'nominal');
  num(d.Pembayaran, 'jumlah');
  num(d.KasRT, 'jumlah');
  num(d.Tambahan, 'tagihan_lain');
  SHEETS.forEach((s) =>
    d[s].forEach((r) => {
      r.id = String(r.id);
    }),
  );
  d.Warga.forEach((w) => {
    w.pembangunan = String(w.pembangunan || '1');
    w.lingkungan = String(w.lingkungan || '1');
    w.status = w.status || 'Aktif';
    w.mulai = String(w.mulai || '').slice(0, 7);
    w.nama = String(w.nama);
  });
  d.Kejadian.forEach((k) => {
    k.warga_id = String(k.warga_id);
    k.periode = String(k.periode).slice(0, 7);
    k.tanggal = String(k.tanggal).slice(0, 10);
  });
  d.Pembayaran.forEach((b) => {
    b.warga_id = String(b.warga_id);
    b.periode = String(b.periode).slice(0, 7);
    b.tanggal = String(b.tanggal).slice(0, 10);
    b.pos = String(b.pos);
  });
  d.Tambahan.forEach((t) => {
    t.warga_id = String(t.warga_id);
    t.periode = String(t.periode).slice(0, 7);
    t.catatan = String(t.catatan || '');
  });
  d.KasRT.forEach((x) => {
    x.tanggal = String(x.tanggal).slice(0, 10);
    x.tipe = x.tipe || 'Keluar';
  });
  DEFAULT_TARIF.forEach((t) => {
    if (!d.Tarif.find((x) => x.id === t.id)) d.Tarif.push({ ...t });
  });
  DEFAULT_SETTING.forEach((t) => {
    if (!d.Pengaturan.find((x) => x.id === t.id)) d.Pengaturan.push({ ...t });
  });
  return d;
}
function reindex() {
  S.pidx = {};
  S.D.Pembayaran.forEach((b) => {
    const k = b.warga_id + '|' + b.periode + '|' + b.pos;
    S.pidx[k] = (S.pidx[k] || 0) + (+b.jumlah || 0);
  });
}
async function loadAll(silent) {
  busy(true);
  try {
    const r = await api({ action: 'getAll' });
    S.D = normalize(r.data);
    reindex();
    render();
  } catch (e) {
    if (!silent) toast('Gagal memuat: ' + e.message, true);
    throw e;
  } finally {
    busy(false);
  }
}
async function persist(sheet, rows) {
  rows.forEach((r) => {
    const a = S.D[sheet];
    const i = a.findIndex((x) => x.id === r.id);
    i >= 0 ? (a[i] = r) : a.push(r);
  });
  reindex();
  render();
  busy(true);
  try {
    await api({ action: 'upsert', sheet, rows });
  } catch (e) {
    toast('Gagal menyimpan: ' + e.message, true);
    await loadAll(true).catch(() => {});
  } finally {
    busy(false);
  }
}
async function removeRows(sheet, ids) {
  S.D[sheet] = S.D[sheet].filter((x) => !ids.includes(x.id));
  reindex();
  render();
  busy(true);
  try {
    await api({ action: 'remove', sheet, ids });
  } catch (e) {
    toast('Gagal menghapus: ' + e.message, true);
    await loadAll(true).catch(() => {});
  } finally {
    busy(false);
  }
}

/* ---------- Perhitungan tagihan ---------- */
const tarif = (k) => {
  const t = S.D.Tarif.find((x) => x.id === k);
  return t ? +t.nominal : 0;
};
const setting = (k) => (S.D.Pengaturan.find((x) => x.id === k) || {}).nilai || '';
const tambahan = (wid, p) => {
  const t = S.D.Tambahan.find((x) => x.id === wid + '_' + p);
  return t ? { tagihan_lain: +t.tagihan_lain || 0, catatan: t.catatan || '' } : { tagihan_lain: 0, catatan: '' };
};
const paid = (wid, p, pos) => S.pidx[wid + '|' + p + '|' + pos] || 0;

function billItems(w, p) {
  if (w.status === 'Nonaktif') return [];
  if (w.mulai && p < w.mulai) return [];
  const it = [];
  const add = (pos, label, nominal) => it.push({ pos, label, nominal });
  add('kas_rw', 'Kas RW', tarif('kas_rw'));
  add('kas_rt', 'Kas RT', tarif('kas_rt'));
  if (w.koperasi === 'Ya') add('koperasi', 'Koperasi', tarif('koperasi'));
  if (w.arisan === 'Ya') add('arisan', 'Arisan', tarif('arisan'));
  add('pembangunan', 'Pembangunan', tarif('pembangunan_' + w.pembangunan));
  add('lingkungan', 'Lingkungan', tarif('lingkungan_' + w.lingkungan));
  S.D.Kejadian.filter((k) => k.periode === p).forEach((k) => {
    if (k.kecualikan === 'Ya' && k.warga_id === w.id) return;
    add('tali_' + k.id, `Tali Asih ${k.jenis} - ${k.nama}`, +k.nominal);
  });
  const tb = tambahan(w.id, p);
  if (tb.tagihan_lain > 0) add('lain', 'Tagihan lainnya', tb.tagihan_lain);
  return it;
}
function bill(w, p) {
  const items = billItems(w, p).map((i) => {
    const pd = paid(w.id, p, i.pos);
    return { ...i, paid: pd, sisa: Math.max(0, i.nominal - pd) };
  });
  return { items, total: sum(items, (i) => i.nominal), paid: sum(items, (i) => Math.min(i.paid, i.nominal)), sisa: sum(items, (i) => i.sisa) };
}
function arrears(w, p) {
  const y = p.slice(0, 4);
  let start = y + '-01';
  if (w.mulai && w.mulai > start) start = w.mulai;
  const out = [];
  for (let m = start; m < p; m = shiftP(m, 1)) {
    const b = bill(w, m);
    if (b.sisa > 0) out.push({ periode: m, sisa: b.sisa });
  }
  return out;
}
function aggregate(p) {
  const agg = {};
  let tot = 0,
    pd = 0,
    lunas = 0,
    n = 0,
    arr = 0;
  S.D.Warga.forEach((w) => {
    const b = bill(w, p);
    if (!b.items.length) return;
    n++;
    if (b.sisa === 0) lunas++;
    b.items.forEach((i) => {
      const g = posGroup(i.pos);
      const a = agg[g] || (agg[g] = { tag: 0, paid: 0 });
      a.tag += i.nominal;
      a.paid += Math.min(i.paid, i.nominal);
    });
    tot += b.total;
    pd += b.paid;
    arr += sum(arrears(w, p), (a) => a.sisa);
  });
  return { agg, tot, paid: pd, lunas, n, arr };
}
const KAS_MASUK = ['PHB', 'Donasi', 'Lainnya'];
const KAS_KELUAR = ['PHB', 'Konsumsi', 'Jasa', 'Transportasi', 'Token', 'Lainnya'];
/* Kas RT saja: iuran Kas RT (otomatis dari pembayaran) + pemasukan/pengeluaran manual */
function kasStats(f) {
  const inF = (t) => !f || String(t).startsWith(f);
  const iuran = sum(
    S.D.Pembayaran.filter((b) => b.pos === 'kas_rt' && inF(b.tanggal)),
    (b) => b.jumlah,
  );
  const lain = sum(
    S.D.KasRT.filter((x) => x.tipe === 'Masuk' && inF(x.tanggal)),
    (x) => x.jumlah,
  );
  const keluar = sum(
    S.D.KasRT.filter((x) => x.tipe === 'Keluar' && inF(x.tanggal)),
    (x) => x.jumlah,
  );
  return { iuran, lain, masuk: iuran + lain, keluar };
}

/* ---------- UI dasar ---------- */
function busy(on) {
  $('#busy').hidden = !on;
}
let toastT;
function toast(msg, err) {
  const t = $('#toast');
  t.textContent = msg;
  t.className = 'toast' + (err ? ' err' : '');
  t.hidden = false;
  clearTimeout(toastT);
  toastT = setTimeout(
    () => {
      t.hidden = true;
    },
    err ? 4500 : 2200,
  );
}
function modal(html) {
  const m = $('#modal');
  m.innerHTML = `<div class="sheet">${html}</div>`;
  m.hidden = false;
  document.body.classList.add('noscroll');
}
function closeModal() {
  $('#modal').hidden = true;
  $('#modal').innerHTML = '';
  document.body.classList.remove('noscroll');
}
const pSwitch = () =>
  `<div class="pswitch"><button data-act="prev" aria-label="Bulan sebelumnya">‹</button><label><span>${periodeLabel(S.periode)}</span><input type="month" value="${S.periode}" data-bind="periode"></label><button data-act="next" aria-label="Bulan berikutnya">›</button></div>`;
const searchBox = (ph) => `<input class="search" type="search" placeholder="${ph}" value="${esc(S.q)}" data-bind="q">`;
const initial = (n) => esc((n || '?').trim().charAt(0).toUpperCase());
const wargaTags = (w) =>
  `<div class="tags">${w.koperasi === 'Ya' ? '<span class="badge blue">Koperasi</span>' : ''}${w.arisan === 'Ya' ? '<span class="badge blue">Arisan</span>' : ''}<span class="badge blue">Pemb. ${rp(tarif('pembangunan_' + w.pembangunan))}</span><span class="badge blue">Ling. ${rp(tarif('lingkungan_' + w.lingkungan))}</span></div>`;

/* ---------- Navigasi ---------- */
const NAV = [
  ['home', 'Beranda', 'home'],
  ['tagihan', 'Tagihan', 'bill'],
  ['warga', 'Warga', 'users'],
  ['tali', 'Tali Asih', 'heart'],
  ['kas', 'Kas RT', 'wallet'],
  ['cetak', 'Cetak Tagihan', 'printer'],
  ['setting', 'Pengaturan', 'gear'],
];
const BOTTOM = [
  ['home', 'Beranda', 'home'],
  ['tagihan', 'Tagihan', 'bill'],
  ['warga', 'Warga', 'users'],
  ['tali', 'Tali Asih', 'heart'],
  ['lainnya', 'Lainnya', 'menu'],
];
const TITLES = { home: 'Beranda', tagihan: 'Tagihan & Pembayaran', warga: 'Data Warga (KK)', tali: 'Tali Asih', kas: 'Kas RT', cetak: 'Cetak Tagihan', setting: 'Pengaturan', lainnya: 'Menu Lainnya' };
function go(page) {
  S.page = page;
  S.q = '';
  window.scrollTo(0, 0);
  render();
}

function render() {
  if (!S.D.Warga) return;
  $('#sideNav').innerHTML = NAV.map(([k, l, i]) => `<button class="${S.page === k ? 'on' : ''}" data-act="nav" data-page="${k}">${ico(i)}${l}</button>`).join('') + `<button data-act="logout">${ico('logout')}Keluar</button>`;
  const grp = ['kas', 'cetak', 'setting'].includes(S.page) ? 'lainnya' : S.page;
  $('#bottomNav').innerHTML = BOTTOM.map(([k, l, i]) => `<button class="${grp === k ? 'on' : ''}" data-act="nav" data-page="${k}">${ico(i)}${l}</button>`).join('');
  $('#pageTitle').textContent = TITLES[S.page];
  $('#syncBtn').innerHTML = ico('sync');
  $('#brandSub').textContent = setting('nama_rt');
  $('#modeTag').hidden = !CFG.demo;
  $('#view').innerHTML = PAGES[S.page]();
}

/* ---------- Halaman: Beranda ---------- */
function pageHome() {
  const p = S.periode,
    a = aggregate(p),
    k = kasStats('');
  const pct = a.tot ? Math.round((a.paid / a.tot) * 100) : 0;
  const rows = POS.filter(([key]) => a.agg[key])
    .map(([key, l]) => {
      const x = a.agg[key];
      return `<tr><td>${l}</td><td class="r">${rp(x.tag)}</td><td class="r">${rp(x.paid)}</td><td class="r">${rp(x.tag - x.paid)}</td></tr>`;
    })
    .join('');
  return `${pSwitch()}
  <section class="hero"><small>Terkumpul · ${periodeLabel(p)}</small><h2>${rp(a.paid)}</h2><div class="bar"><i style="width:${pct}%"></i></div>
    <div class="hero-f"><span>${pct}% dari ${rp(a.tot)}</span><span>${a.lunas}/${a.n} KK lunas</span></div></section>
  <div class="grid2">
    <div class="stat"><small>Belum tertagih</small><b class="bad">${rp(a.tot - a.paid)}</b></div>
    <div class="stat"><small>Tunggakan bulan lalu</small><b class="warn">${rp(a.arr)}</b></div>
    <div class="stat"><small>Saldo Kas RT</small><b class="ok">${rp(k.masuk - k.keluar)}</b></div>
    <div class="stat"><small>KK aktif ditagih</small><b>${a.n}</b></div>
  </div>
  <div class="card"><h3>Rincian per pos</h3>${rows ? `<table><tr><th>Pos</th><th class="r">Tagihan</th><th class="r">Terbayar</th><th class="r">Sisa</th></tr>${rows}</table>` : '<div class="empty">Belum ada tagihan. Tambahkan data warga terlebih dahulu.</div>'}</div>
  <div class="row-btns"><button class="btn primary" data-act="nav" data-page="tagihan">Catat pembayaran</button><button class="btn ghost" data-act="nav" data-page="cetak">${ico('printer')}Cetak tagihan</button></div>`;
}

/* ---------- Halaman: Tagihan ---------- */
function pageTagihan() {
  return `${pSwitch()}${searchBox('Cari nama / alamat warga…')}
  <div class="chips">${[
    ['all', 'Semua'],
    ['belum', 'Belum lunas'],
    ['lunas', 'Lunas'],
  ]
    .map(([k, l]) => `<button class="chip ${S.filter === k ? 'on' : ''}" data-act="filter" data-f="${k}">${l}</button>`)
    .join('')}</div>
  <div id="list">${listTagihan()}</div>`;
}
function listTagihan() {
  const q = S.q.toLowerCase();
  const rows = S.D.Warga.filter((w) => !q || (w.nama + ' ' + w.alamat).toLowerCase().includes(q))
    .map((w) => ({ w, b: bill(w, S.periode), ar: arrears(w, S.periode) }))
    .filter((r) => r.b.items.length)
    .filter((r) => S.filter === 'all' || (S.filter === 'lunas' ? r.b.sisa === 0 : r.b.sisa > 0 || r.ar.length))
    .sort((x, y) => x.w.nama.localeCompare(y.w.nama));
  if (!rows.length) return '<div class="empty">Tidak ada data.</div>';
  return rows
    .map(({ w, b, ar }) => {
      const arT = sum(ar, (a) => a.sisa);
      return `<button class="item" data-act="pay" data-id="${w.id}"><div class="avatar">${initial(w.nama)}</div>
      <div class="grow"><b>${esc(w.nama)}</b><small>${esc(w.alamat)} · ${rp(b.total)}</small>${arT ? `<small style="color:var(--bad);font-weight:600">Tunggakan ${rp(arT)}</small>` : ''}</div>
      <div class="end">${b.sisa === 0 ? '<span class="badge ok">Lunas</span>' : `<b>${rp(b.sisa)}</b><span class="badge ${b.paid ? 'warn' : 'bad'}">${b.paid ? 'Sebagian' : 'Belum bayar'}</span>`}</div></button>`;
    })
    .join('');
}

/* ---------- Modal pembayaran ---------- */
function waLink(w, p) {
  const b = bill(w, p),
    ar = arrears(w, p);
  let hp = String(w.hp || '').replace(/\D/g, '');
  if (hp.startsWith('0')) hp = '62' + hp.slice(1);
  const lines = [`Yth. Bapak/Ibu ${w.nama},`, `Tagihan iuran ${setting('nama_rt')} periode ${periodeLabel(p)}:`, ...b.items.map((i) => `- ${i.label}: ${rp(i.nominal)}${i.sisa === 0 ? ' (lunas)' : ''}`)];
  ar.forEach((a) => lines.push(`- Tunggakan ${periodeLabel(a.periode)}: ${rp(a.sisa)}`));
  const cat = tambahan(w.id, p).catatan;
  if (cat) lines.push(`Catatan: ${cat}`);
  lines.push(`*Total yang harus dibayar: ${rp(b.sisa + sum(ar, (a) => a.sisa))}*`, `Jatuh tempo: ${setting('jatuh_tempo')}`, 'Terima kasih.', `Bendahara ${setting('bendahara')}`);
  return `https://wa.me/${hp}?text=${encodeURIComponent(lines.join('\n'))}`;
}
function payModal(wid, p) {
  const w = S.D.Warga.find((x) => x.id === wid);
  if (!w) return;
  const b = bill(w, p),
    ar = arrears(w, p);
  const tb = tambahan(wid, p);
  const hist = S.D.Pembayaran.filter((x) => x.warga_id === wid && x.periode === p).sort((a, c) => String(c.tanggal).localeCompare(String(a.tanggal)));
  modal(`<div class="sheet-h"><div><h3>${esc(w.nama)}</h3><small>${esc(w.alamat)} · ${periodeLabel(p)}</small></div><button class="x" data-act="close">✕</button></div>
  ${ar.length ? `<div class="warnbox">Tunggakan: ${ar.map((a) => `<button class="chip bad" data-act="pay" data-id="${wid}" data-p="${a.periode}">${periodeLabel(a.periode)} · ${rp(a.sisa)}</button>`).join('')}</div>` : ''}
  ${
    b.items.length
      ? `<div id="payrows">${b.items
          .filter((i) => i.pos !== 'lain')
          .map(
            (i) => `<div class="prow"><div><b>${esc(i.label)}</b><small>Tagihan ${rp(i.nominal)}${i.paid ? ' · dibayar ' + rp(i.paid) : ''}</small></div>
      <input type="number" inputmode="numeric" min="0" step="500" value="${i.sisa}" data-pos="${esc(i.pos)}" data-max="${i.sisa}" data-bind="payamt"></div>`,
          )
          .join('')}
      ${(() => {
        const li = b.items.find((i) => i.pos === 'lain');
        return `<div class="prow lain"><div><b>Tagihan lainnya</b><small>${li ? 'Tagihan ' + rp(li.nominal) + (li.paid ? ' · dibayar ' + rp(li.paid) : '') : 'Di luar sistem aplikasi'}</small></div>
        ${li ? `<input type="number" inputmode="numeric" min="0" step="500" value="${li.sisa}" data-pos="lain" data-max="${li.sisa}" data-bind="payamt">` : ''}
        <div class="sub"><small>Nominal tagihan lainnya:</small><input type="number" inputmode="numeric" min="0" step="500" id="lainamt" value="${tb.tagihan_lain || ''}" placeholder="0"></div></div>`;
      })()}</div>
    <div class="field" style="margin-top:12px"><span>Catatan:</span><input type="text" id="paynote" value="${esc(tb.catatan)}" placeholder="Tampil di kolom Keterangan tagihan cetak"></div>
    <button class="btn ghost sm" style="margin-bottom:12px" data-act="savetambahan" data-id="${wid}" data-p="${p}">Simpan tagihan lainnya &amp; catatan</button>
    <div class="sumline"><span>Dibayar sekarang</span><span id="paytot">${rp(b.sisa)}</span></div>
    <div class="two"><div class="field"><span>Tanggal bayar</span><input type="date" id="paydate" value="${today()}"></div>
      <div class="field"><span>Metode</span><select id="paymet"><option>Tunai</option><option>Transfer</option></select></div></div>
    <button class="btn primary block" data-act="savepay" data-id="${wid}" data-p="${p}">Simpan pembayaran</button>
    <div class="row-btns"><button class="btn ghost sm" data-act="resetpay">Lunasi semua</button><button class="btn ghost sm" data-act="clearpay">Kosongkan</button>
      <button class="btn ghost sm" data-act="printOne" data-id="${wid}" data-p="${p}">${ico('printer')}Cetak</button>
      ${w.hp ? `<a class="btn wa sm" target="_blank" rel="noopener" href="${waLink(w, p)}">${ico('wa')}Kirim WA</a>` : ''}</div>`
      : '<div class="empty">Tidak ada tagihan pada periode ini.</div>'
  }
  ${hist.length ? `<h3 style="font-size:14px;margin-top:6px">Riwayat pembayaran</h3><div class="hist">${hist.map((h) => `<div><span>${tglIndo(h.tanggal)} · ${esc(h.pos.startsWith('tali_') ? 'Tali Asih' : posLabel(h.pos))} · ${esc(h.metode)}</span><span><b>${rp(h.jumlah)}</b> <button data-act="delpay" data-id="${h.id}" data-w="${wid}" data-p="${p}" title="Hapus">✕</button></span></div>`).join('')}</div>` : ''}`);
}

/* ---------- Halaman: Warga ---------- */
function pageWarga() {
  return `${searchBox('Cari nama / alamat…')}<div id="list">${listWarga()}</div><button class="fab" data-act="addwarga" aria-label="Tambah warga">+</button>`;
}
function listWarga() {
  const q = S.q.toLowerCase();
  const rows = S.D.Warga.filter((w) => !q || (w.nama + ' ' + w.alamat).toLowerCase().includes(q)).sort((a, b) => a.nama.localeCompare(b.nama));
  if (!rows.length) return '<div class="empty">Belum ada data warga. Tekan tombol + untuk menambah.</div>';
  return (
    `<p class="note" style="margin-top:0">${rows.length} KK${S.D.Warga.some((w) => w.status === 'Nonaktif') ? ' (termasuk nonaktif)' : ''}</p>` +
    rows
      .map(
        (
          w,
        ) => `<button class="item" data-act="editwarga" data-id="${w.id}"><div class="avatar">${initial(w.nama)}</div><div class="grow"><b>${esc(w.nama)}</b><small>${esc(w.alamat)}${w.hp ? ' · ' + esc(w.hp) : ''}</small>${wargaTags(w)}</div>
      <div class="end">${w.status === 'Nonaktif' ? '<span class="badge bad">Nonaktif</span>' : ''}</div></button>`,
      )
      .join('')
  );
}
function wargaForm(id) {
  const w = S.D.Warga.find((x) => x.id === id) || { nama: '', alamat: '', hp: '', pembangunan: '1', lingkungan: '1', koperasi: 'Tidak', arisan: 'Tidak', mulai: '', status: 'Aktif' };
  modal(`<div class="sheet-h"><h3>${id ? 'Ubah data warga' : 'Tambah warga (KK)'}</h3><button class="x" data-act="close">✕</button></div>
  <form data-form="warga" data-id="${id || ''}">
    <div class="field"><span>Nama kepala keluarga</span><input type="text" name="nama" required value="${esc(w.nama)}"></div>
    <div class="field"><span>Alamat / No. rumah</span><input type="text" name="alamat" value="${esc(w.alamat)}"></div>
    <div class="field"><span>No. HP / WhatsApp</span><input type="tel" name="hp" inputmode="tel" value="${esc(w.hp)}"></div>
    <div class="two">
      <div class="field"><span>Iuran Pembangunan</span><select name="pembangunan"><option value="1" ${w.pembangunan === '1' ? 'selected' : ''}>${rp(tarif('pembangunan_1'))}</option><option value="2" ${w.pembangunan === '2' ? 'selected' : ''}>${rp(tarif('pembangunan_2'))}</option><option value="3" ${w.pembangunan === '3' ? 'selected' : ''}>${rp(tarif('pembangunan_3'))}</option></select></div>
      <div class="field"><span>Iuran Lingkungan</span><select name="lingkungan"><option value="1" ${w.lingkungan === '1' ? 'selected' : ''}>${rp(tarif('lingkungan_1'))}</option><option value="2" ${w.lingkungan === '2' ? 'selected' : ''}>${rp(tarif('lingkungan_2'))}</option><option value="3" ${w.lingkungan === '3' ? 'selected' : ''}>${rp(tarif('lingkungan_3'))}</option></select></div>
    </div>
    <label class="switch">Anggota Koperasi (${rp(tarif('koperasi'))})<input type="checkbox" name="koperasi" ${w.koperasi === 'Ya' ? 'checked' : ''}></label>
    <label class="switch">Peserta Arisan (${rp(tarif('arisan'))})<input type="checkbox" name="arisan" ${w.arisan === 'Ya' ? 'checked' : ''}></label>
    <div class="two">
      <div class="field"><span>Mulai ditagih (opsional)</span><input type="month" name="mulai" value="${esc(w.mulai)}"></div>
      <div class="field"><span>Status</span><select name="status"><option ${w.status === 'Aktif' ? 'selected' : ''}>Aktif</option><option ${w.status === 'Nonaktif' ? 'selected' : ''}>Nonaktif</option></select></div>
    </div>
    <button class="btn primary block" type="submit">Simpan</button>
    ${id ? `<div class="row-btns"><button class="btn danger" type="button" data-act="delwarga" data-id="${id}">Hapus warga</button></div><p class="note">Jika warga pindah, lebih baik ubah status menjadi <b>Nonaktif</b> agar riwayat pembayaran tetap tersimpan.</p>` : ''}
  </form>`);
}

/* ---------- Halaman: Tali Asih ---------- */
function pageTali() {
  const ks = [...S.D.Kejadian].sort((a, b) => String(b.tanggal).localeCompare(String(a.tanggal)));
  const list = ks
    .map((k) => {
      const pos = 'tali_' + k.id;
      let target = 0,
        got = 0,
        n = 0;
      S.D.Warga.forEach((w) => {
        const i = billItems(w, k.periode).find((x) => x.pos === pos);
        if (i) {
          n++;
          target += i.nominal;
          got += Math.min(paid(w.id, k.periode, pos), i.nominal);
        }
      });
      const pct = target ? Math.round((got / target) * 100) : 0;
      return `<button class="item" data-act="editkejadian" data-id="${k.id}" style="align-items:flex-start"><div class="avatar ${k.jenis === 'Kematian' ? 'heart' : 'sick'}">${k.jenis === 'Kematian' ? '🎗️' : '✚'}</div>
      <div class="grow"><b>${esc(k.jenis)} – ${esc(k.nama)}</b><small>${tglIndo(k.tanggal)} · ditagih ${periodeLabel(k.periode)}</small>
      <div class="bar blue" style="margin:8px 0 4px"><i style="width:${pct}%"></i></div><small>${rp(got)} / ${rp(target)} · ${n} KK × ${rp(k.nominal)}</small></div>
      <div class="end"><span class="badge ${pct >= 100 ? 'ok' : 'warn'}">${pct}%</span></div></button>`;
    })
    .join('');
  return `<p class="note" style="margin-top:0">Tali Asih ditagihkan sesuai kejadian (bukan otomatis tiap bulan). Tekan + saat ada warga meninggal atau sakit.</p>${list || '<div class="empty">Belum ada kejadian Tali Asih.</div>'}<button class="fab" data-act="addkejadian" aria-label="Tambah kejadian">+</button>`;
}
function kejadianForm(id) {
  const k = S.D.Kejadian.find((x) => x.id === id) || { jenis: 'Kematian', warga_id: '', nama: '', tanggal: today(), periode: today().slice(0, 7), nominal: tarif('tali_kematian'), kecualikan: 'Ya', keterangan: '' };
  const ws = [...S.D.Warga].sort((a, b) => a.nama.localeCompare(b.nama));
  modal(`<div class="sheet-h"><h3>${id ? 'Ubah kejadian' : 'Kejadian Tali Asih baru'}</h3><button class="x" data-act="close">✕</button></div>
  <form data-form="kejadian" data-id="${id || ''}">
    <div class="two"><div class="field"><span>Jenis</span><select name="jenis" data-bind="jenis"><option ${k.jenis === 'Kematian' ? 'selected' : ''}>Kematian</option><option ${k.jenis === 'Sakit' ? 'selected' : ''}>Sakit</option></select></div>
      <div class="field"><span>Nominal per KK</span><input type="number" name="nominal" inputmode="numeric" required value="${k.nominal}"></div></div>
    <div class="field"><span>KK terkait</span><select name="warga_id" data-bind="taliwarga" required><option value="">— pilih KK —</option>${ws.map((w) => `<option value="${w.id}" data-n="${esc(w.nama)}" ${w.id === k.warga_id ? 'selected' : ''}>${esc(w.nama)} – ${esc(w.alamat)}</option>`).join('')}</select></div>
    <div class="field"><span>Nama yang terkena (boleh anggota keluarga)</span><input type="text" name="nama" required value="${esc(k.nama)}"></div>
    <div class="two"><div class="field"><span>Tanggal kejadian</span><input type="date" name="tanggal" required value="${esc(k.tanggal)}"></div>
      <div class="field"><span>Ditagihkan pada bulan</span><input type="month" name="periode" required value="${esc(k.periode)}"></div></div>
    <label class="switch">KK terkait tidak ditagih<input type="checkbox" name="kecualikan" ${k.kecualikan === 'Ya' ? 'checked' : ''}></label>
    <div class="field"><span>Keterangan</span><input type="text" name="keterangan" value="${esc(k.keterangan)}"></div>
    <button class="btn primary block" type="submit">Simpan</button>
    ${id ? `<div class="row-btns"><button class="btn danger" type="button" data-act="delkejadian" data-id="${id}">Hapus kejadian</button></div>` : ''}
  </form>`);
}

/* ---------- Halaman: Kas RT ---------- */
const katOptions = (t, sel) => (t === 'Masuk' ? KAS_MASUK : KAS_KELUAR).map((c) => `<option ${c === sel ? 'selected' : ''}>${c}</option>`).join('');
function pageKas() {
  const f = S.kasFilter,
    k = kasStats(f),
    all = kasStats('');
  const iuranRows = S.D.Pembayaran.filter((b) => b.pos === 'kas_rt' && String(b.tanggal).startsWith(f));
  const tx = S.D.KasRT.filter((x) => String(x.tanggal).startsWith(f)).sort((a, b) => String(b.tanggal).localeCompare(String(a.tanggal)));
  return `<div class="pswitch"><button data-act="kasprev">‹</button><label><span>${periodeLabel(f)}</span><input type="month" value="${f}" data-bind="kasf"></label><button data-act="kasnext">›</button></div>
  <section class="hero"><small>Total Saldo Kas RT</small><h2>${rp(all.masuk - all.keluar)}</h2>
    <div class="hero-f"><span>Total masuk ${rp(all.masuk)}</span><span>Total keluar ${rp(all.keluar)}</span></div></section>
  <div class="grid2" style="grid-template-columns:1fr 1fr">
    <div class="stat"><small>Pemasukan ${periodeLabel(f)}</small><b class="ok">${rp(k.masuk)}</b></div>
    <div class="stat"><small>Pengeluaran ${periodeLabel(f)}</small><b class="bad">${rp(k.keluar)}</b></div></div>
  <div class="card"><h3>Transaksi ${periodeLabel(f)}</h3>
    ${k.iuran ? `<div class="item" style="box-shadow:none;background:var(--b4);padding:10px 12px"><div class="grow"><b>Iuran Kas RT warga</b><small>${iuranRows.length} pembayaran (otomatis dari menu Tagihan)</small></div><b style="color:var(--ok)">+${rp(k.iuran)}</b></div>` : ''}
    ${tx.map((x) => `<button class="item" style="box-shadow:none;background:var(--b4);padding:10px 12px" data-act="editkas" data-id="${x.id}"><div class="grow"><b>${esc(x.keterangan || x.kategori)}</b><small>${tglIndo(x.tanggal)} · ${esc(x.kategori)}</small></div><b style="color:var(--${x.tipe === 'Masuk' ? 'ok' : 'bad'})">${x.tipe === 'Masuk' ? '+' : '−'}${rp(x.jumlah)}</b></button>`).join('')}
    ${!k.iuran && !tx.length ? '<div class="empty">Belum ada transaksi bulan ini.</div>' : ''}</div>
  <button class="fab" data-act="addkas" aria-label="Catat transaksi kas">+</button>`;
}
function kasForm(id) {
  const x = S.D.KasRT.find((v) => v.id === id) || { tipe: 'Keluar', tanggal: today(), kategori: '', keterangan: '', jumlah: '' };
  modal(`<div class="sheet-h"><h3>${id ? 'Ubah transaksi kas' : 'Catat transaksi Kas RT'}</h3><button class="x" data-act="close">✕</button></div>
  <form data-form="kas" data-id="${id || ''}">
    <input type="hidden" name="tipe" value="${x.tipe}">
    <div class="chips"><button type="button" class="chip ${x.tipe === 'Masuk' ? 'on' : ''}" data-act="kastipe" data-t="Masuk">Pemasukan</button><button type="button" class="chip ${x.tipe === 'Keluar' ? 'on' : ''}" data-act="kastipe" data-t="Keluar">Pengeluaran</button></div>
    <div class="two"><div class="field"><span>Tanggal</span><input type="date" name="tanggal" required value="${esc(x.tanggal)}"></div>
      <div class="field"><span>Kategori</span><select name="kategori">${katOptions(x.tipe, x.kategori)}</select></div></div>
    <div class="field"><span>Keterangan</span><input type="text" name="keterangan" value="${esc(x.keterangan)}" placeholder="Contoh: Konsumsi kerja bakti"></div>
    <div class="field"><span>Jumlah (Rp)</span><input type="number" name="jumlah" inputmode="numeric" required min="1" value="${x.jumlah}"></div>
    <button class="btn primary block" type="submit">Simpan</button>
    ${id ? `<div class="row-btns"><button class="btn danger" type="button" data-act="delkas" data-id="${id}">Hapus</button></div>` : ''}
  </form>`);
}

/* ---------- Halaman: Lainnya, Cetak, Pengaturan ---------- */
function pageLainnya() {
  return (
    [
      ['kas', 'Kas RT', 'Saldo, pemasukan & pengeluaran Kas RT', 'wallet'],
      ['cetak', 'Cetak Tagihan', 'Tagihan bulanan tiap warga', 'printer'],
      ['setting', 'Pengaturan', 'Tarif iuran, identitas RT, PIN', 'gear'],
    ]
      .map(([k, t, d, i]) => `<button class="menu-card" data-act="nav" data-page="${k}"><div class="avatar">${ico(i)}</div><div><div>${t}</div><small>${d}</small></div></button>`)
      .join('') + `<button class="menu-card" data-act="logout"><div class="avatar heart">${ico('logout')}</div><div><div>Keluar</div><small>Kunci aplikasi</small></div></button>`
  );
}
function cetakTargets() {
  const c = S.cetak;
  let ws = S.D.Warga.filter((w) => bill(w, S.periode).items.length);
  if (c.target === 'belum') ws = ws.filter((w) => bill(w, S.periode).sisa > 0 || arrears(w, S.periode).length);
  if (c.target === 'one') ws = ws.filter((w) => w.id === c.wid);
  return ws.sort((a, b) => a.nama.localeCompare(b.nama));
}
function pageCetak() {
  const c = S.cetak,
    all = S.D.Warga.filter((w) => w.status !== 'Nonaktif').sort((a, b) => a.nama.localeCompare(b.nama));
  return `${pSwitch()}<div class="card">
    <div class="field"><span>Warga yang dicetak</span><select data-bind="ctarget"><option value="all" ${c.target === 'all' ? 'selected' : ''}>Semua warga aktif</option><option value="belum" ${c.target === 'belum' ? 'selected' : ''}>Hanya yang belum lunas / menunggak</option><option value="one" ${c.target === 'one' ? 'selected' : ''}>Satu warga saja</option></select></div>
    ${c.target === 'one' ? `<div class="field"><span>Pilih warga</span><select data-bind="cwid"><option value="">— pilih —</option>${all.map((w) => `<option value="${w.id}" ${c.wid === w.id ? 'selected' : ''}>${esc(w.nama)} – ${esc(w.alamat)}</option>`).join('')}</select></div>` : ''}
    <div class="field"><span>Ukuran cetak</span><select data-bind="csize"><option value="2" ${c.size === '2' ? 'selected' : ''}>2 tagihan per lembar A4 (hemat kertas)</option><option value="1" ${c.size === '1' ? 'selected' : ''}>Kertas A4</option><option value="6" ${c.size === '6' ? 'selected' : ''}>Kertas A6</option></select></div>
    <label class="switch">Sertakan tunggakan bulan sebelumnya<input type="checkbox" ${c.ar ? 'checked' : ''} data-bind="car"></label>
    <p class="note" id="cnt">${cetakTargets().length} tagihan akan dicetak untuk ${periodeLabel(S.periode)}.</p>
    <button class="btn primary block" data-act="doprint">${ico('printer')}Cetak / Simpan PDF</button>
    <p class="note">Di HP: pilih “Cetak” lalu “Simpan sebagai PDF” untuk membagikan tagihan lewat WhatsApp.</p></div>`;
}
function buildBill(w, p, withAr) {
  const b = bill(w, p),
    ar = withAr ? arrears(w, p) : [],
    arT = sum(ar, (a) => a.sisa);
  const harus = b.sisa + arT,
    cat = tambahan(w.id, p).catatan;
  return `<section class="bill">
    <div class="bh"><div><b>${esc(setting('nama_rt'))}</b>${esc(setting('kelurahan'))}</div><div class="t">TAGIHAN IURAN WARGA<br>Periode: ${periodeLabel(p)}</div></div>
    <div class="info"><span>Nama KK</span><span>: <b>${esc(w.nama)}</b></span><span>Alamat</span><span>: ${esc(w.alamat)}</span></div>
    <table><tr><th style="width:24px">No</th><th>Pos Iuran</th><th class="r">Tagihan</th><th class="r">Dibayar</th><th class="r">Sisa</th></tr>
    ${b.items.map((i, n) => `<tr><td>${n + 1}</td><td>${esc(i.label)}</td><td class="r">${rp(i.nominal)}</td><td class="r">${i.paid ? rp(i.paid) : '-'}</td><td class="r">${rp(i.sisa)}</td></tr>`).join('')}
    <tr><td colspan="2"><b>Jumlah bulan ini</b></td><td class="r"><b>${rp(b.total)}</b></td><td class="r"><b>${rp(b.paid)}</b></td><td class="r"><b>${rp(b.sisa)}</b></td></tr>
    ${ar.map((a) => `<tr><td></td><td colspan="3">Tunggakan ${periodeLabel(a.periode)}</td><td class="r">${rp(a.sisa)}</td></tr>`).join('')}</table>
    ${cat ? `<div style="margin-top:5px"><b>Catatan:</b> ${esc(cat)}</div>` : ''}
    <div class="big"><span>TOTAL YANG HARUS DIBAYAR</span><span>${rp(harus)}</span></div>
    <div class="foot"><div><div>Jatuh tempo: <b>${esc(setting('jatuh_tempo'))}</b></div><div>${esc(setting('info_bayar'))}</div><div style="margin-top:3px;color:#555">Dicetak ${tglIndo(today())}</div></div>
    <div class="ttd">Bendahara<div></div><b>${esc(setting('bendahara') || '..............')}</b></div></div></section>`;
}
function buildBill6(w, p, withAr) {
  const b = bill(w, p),
    ar = withAr ? arrears(w, p) : [],
    arT = sum(ar, (a) => a.sisa),
    cat = tambahan(w.id, p).catatan;
  const harus = b.sisa + arT;
  let n = 0;
  const rows = b.items
    .map((i) => `<tr><td>${++n}</td><td>${esc(i.label)}</td><td class="r">${rp(i.nominal)}</td></tr>`)
    .concat(
      ar.length > 2
        ? [`<tr><td>${++n}</td><td>Tunggakan ${ar.length} bulan (${periodeLabel(ar[0].periode)} – ${periodeLabel(ar[ar.length - 1].periode)})</td><td class="r">${rp(arT)}</td></tr>`]
        : ar.map((a) => `<tr><td>${++n}</td><td>Tunggakan ${periodeLabel(a.periode)}</td><td class="r">${rp(a.sisa)}</td></tr>`),
    );
  return `<section class="bill a6">
    <div class="bh"><div><b>${esc(setting('nama_rt'))}</b>${esc(setting('kelurahan'))}</div><div class="t">TAGIHAN IURAN<br>${periodeLabel(p)}</div></div>
    <div class="info"><span>Nama KK</span><span>: <b>${esc(w.nama)}</b></span><span>Alamat</span><span>: ${esc(w.alamat)}</span></div>
    <table><tr><th style="width:9%">No</th><th>Pos Iuran</th><th class="r">Tagihan</th></tr>${rows.join('')}</table>
    ${cat ? `<div class="cat"><b>Catatan:</b> ${esc(cat)}</div>` : ''}
    <div class="big"><span>TOTAL BAYAR</span><span>${rp(harus)}</span></div>
    <div class="foot"><div><div>Jatuh tempo: <b>${esc(setting('jatuh_tempo'))}</b></div><div>${esc(setting('info_bayar'))}</div></div>
    <div class="ttd">Bendahara<div></div><b>${esc(setting('bendahara') || '........')}</b></div></div></section>`;
}
function printBills(ws, p, withAr, size) {
  if (!ws.length) return toast('Tidak ada tagihan untuk dicetak', true);
  const pa = $('#printArea');
  pa.className = 'p' + size;
  pa.innerHTML = ws.map((w) => (size === '6' ? buildBill6 : buildBill)(w, p, withAr)).join('');
  let st = $('#pageStyle');
  if (!st) {
    st = document.createElement('style');
    st.id = 'pageStyle';
    document.head.appendChild(st);
  }
  st.textContent = size === '6' ? '@page{size:105mm 148mm;margin:5mm}' : '@page{size:A4;margin:10mm}';
  setTimeout(() => window.print(), 100);
}
function pageSetting() {
  const tr = S.D.Tarif.map((t) => `<div class="prow"><span>${esc(t.label)}</span><input type="number" inputmode="numeric" name="t_${t.id}" value="${t.nominal}"></div>`).join('');
  const f = (k, l) => `<div class="field"><span>${l}</span><input type="text" name="s_${k}" value="${esc(setting(k))}"></div>`;
  return `<form data-form="setting"><div class="card"><h3>Identitas RT & cetak tagihan</h3>${f('nama_rt', 'Nama RT / RW')}${f('kelurahan', 'Kelurahan / Desa')}${f('bendahara', 'Nama Bendahara')}${f('jatuh_tempo', 'Jatuh tempo pembayaran')}${f('info_bayar', 'Info cara pembayaran (tampil di tagihan)')}</div>
  <div class="card"><h3>Tarif iuran</h3>${tr}<p class="note">Perubahan tarif berlaku untuk seluruh periode (termasuk bulan yang sudah lewat). Jika tarif berubah, ubah di awal bulan baru.</p></div>
  <button class="btn primary block" type="submit">Simpan pengaturan</button></form>
  <div class="card" style="margin-top:14px"><h3>Keamanan</h3>${CFG.demo ? '<p class="note">Mode demo: PIN tidak digunakan.</p>' : '<button class="btn ghost block" data-act="changepin">Ganti PIN</button>'}
  <div class="row-btns"><button class="btn danger" data-act="logout">${ico('logout')}Keluar</button>${CFG.demo ? '<button class="btn ghost" data-act="resetdemo">Reset data demo</button>' : ''}</div></div>`;
}

const PAGES = { home: pageHome, tagihan: pageTagihan, warga: pageWarga, tali: pageTali, kas: pageKas, lainnya: pageLainnya, cetak: pageCetak, setting: pageSetting };

/* ---------- Aksi (klik) ---------- */
const ACT = {
  nav: (el) => go(el.dataset.page),
  close: closeModal,
  reload: () => loadAll().then(() => toast('Data diperbarui')),
  prev: () => {
    S.periode = shiftP(S.periode, -1);
    render();
  },
  next: () => {
    S.periode = shiftP(S.periode, 1);
    render();
  },
  filter: (el) => {
    S.filter = el.dataset.f;
    render();
  },
  pay: (el) => payModal(el.dataset.id, el.dataset.p || S.periode),
  resetpay: () =>
    $$('#payrows input[data-pos]').forEach((i) => {
      i.value = i.dataset.max;
    }) || recalcPay(),
  clearpay: () =>
    $$('#payrows input[data-pos]').forEach((i) => {
      i.value = 0;
    }) || recalcPay(),
  savetambahan: async (el) => {
    const wid = el.dataset.id,
      p = el.dataset.p;
    await saveTambahan(wid, p);
    toast('Tagihan lainnya & catatan tersimpan');
    payModal(wid, p);
  },
  savepay: async (el) => {
    const wid = el.dataset.id,
      p = el.dataset.p,
      tanggal = $('#paydate').value || today(),
      metode = $('#paymet').value;
    const rows = $$('#payrows input[data-pos]')
      .map((i) => ({ pos: i.dataset.pos, amt: Math.round(+i.value || 0) }))
      .filter((x) => x.amt > 0)
      .map((x) => ({ id: uid(), tanggal, warga_id: wid, periode: p, pos: x.pos, jumlah: x.amt, metode, catatan: '' }));
    const changed = await saveTambahan(wid, p);
    if (!rows.length) {
      if (changed) {
        toast('Tagihan lainnya & catatan tersimpan');
        payModal(wid, p);
      } else toast('Isi jumlah pembayaran', true);
      return;
    }
    toast('Pembayaran tersimpan ' + rp(sum(rows, (r) => r.jumlah)));
    await persist('Pembayaran', rows);
    payModal(wid, p);
  },
  delpay: async (el) => {
    if (!confirm('Hapus catatan pembayaran ini?')) return;
    await removeRows('Pembayaran', [el.dataset.id]);
    payModal(el.dataset.w, el.dataset.p);
  },
  printOne: (el) => {
    const w = S.D.Warga.find((x) => x.id === el.dataset.id);
    printBills([w], el.dataset.p, true, '1');
  },
  addwarga: () => wargaForm(''),
  editwarga: (el) => wargaForm(el.dataset.id),
  delwarga: async (el) => {
    const id = el.dataset.id,
      n = S.D.Pembayaran.filter((b) => b.warga_id === id).length;
    if (!confirm('Hapus warga ini' + (n ? ` beserta ${n} catatan pembayarannya` : '') + '? Tindakan ini tidak dapat dibatalkan.')) return;
    closeModal();
    const ids = S.D.Pembayaran.filter((b) => b.warga_id === id).map((b) => b.id);
    if (ids.length) await removeRows('Pembayaran', ids);
    const tid = S.D.Tambahan.filter((t) => t.warga_id === id).map((t) => t.id);
    if (tid.length) await removeRows('Tambahan', tid);
    await removeRows('Warga', [id]);
    toast('Warga dihapus');
  },
  addkejadian: () => kejadianForm(''),
  editkejadian: (el) => kejadianForm(el.dataset.id),
  delkejadian: async (el) => {
    if (!confirm('Hapus kejadian ini beserta pembayaran Tali Asih yang sudah tercatat?')) return;
    const id = el.dataset.id;
    closeModal();
    const ids = S.D.Pembayaran.filter((b) => b.pos === 'tali_' + id).map((b) => b.id);
    if (ids.length) await removeRows('Pembayaran', ids);
    await removeRows('Kejadian', [id]);
    toast('Kejadian dihapus');
  },
  addkas: () => kasForm(''),
  editkas: (el) => kasForm(el.dataset.id),
  delkas: async (el) => {
    if (!confirm('Hapus transaksi ini?')) return;
    closeModal();
    await removeRows('KasRT', [el.dataset.id]);
  },
  kastipe: (el) => {
    const f = el.closest('form');
    f.tipe.value = el.dataset.t;
    $$('[data-act=kastipe]', f).forEach((b) => b.classList.toggle('on', b === el));
    f.kategori.innerHTML = katOptions(el.dataset.t, '');
  },
  kasprev: () => {
    S.kasFilter = shiftP(S.kasFilter, -1);
    render();
  },
  kasnext: () => {
    S.kasFilter = shiftP(S.kasFilter, 1);
    render();
  },
  doprint: () => printBills(cetakTargets(), S.periode, S.cetak.ar, S.cetak.size),
  changepin: () => {
    const n = prompt('Masukkan PIN baru (4–8 angka):');
    if (n === null) return;
    if (!/^\d{4,8}$/.test(n)) return toast('PIN harus 4–8 angka', true);
    busy(true);
    api({ action: 'changePin', newPin: n })
      .then(() => {
        CFG.pin = n;
        if (localStorage.getItem('rt_pin')) localStorage.setItem('rt_pin', n);
        sessionStorage.setItem('rt_pin', n);
        toast('PIN diganti');
      })
      .catch((e) => toast(e.message, true))
      .finally(() => busy(false));
  },
  resetdemo: () => {
    if (confirm('Kembalikan data demo ke awal?')) {
      localStorage.removeItem('rt_demo');
      loadAll().then(() => toast('Data demo direset'));
    }
  },
  logout: () => {
    localStorage.removeItem('rt_pin');
    sessionStorage.removeItem('rt_pin');
    location.reload();
  },
};
async function saveTambahan(wid, p) {
  const lain = Math.max(0, Math.round(+$('#lainamt').value || 0)),
    catatan = $('#paynote').value.trim(),
    cur = tambahan(wid, p);
  if (lain === cur.tagihan_lain && catatan === cur.catatan) return false;
  await persist('Tambahan', [{ id: wid + '_' + p, warga_id: wid, periode: p, tagihan_lain: lain, catatan }]);
  return true;
}
function recalcPay() {
  const t = sum($$('#payrows input[data-pos]'), (i) => i.value);
  const el = $('#paytot');
  if (el) el.textContent = rp(t);
}

document.addEventListener('click', (e) => {
  if (e.target.id === 'modal') return closeModal();
  const el = e.target.closest('[data-act]');
  if (!el || el.tagName === 'A') return;
  e.preventDefault();
  const f = ACT[el.dataset.act];
  if (f) f(el);
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !$('#modal').hidden) closeModal();
});

/* ---------- Input (bind) ---------- */
const refreshList = () => {
  const l = $('#list');
  if (l) l.innerHTML = S.page === 'warga' ? listWarga() : listTagihan();
};
const BIND = {
  q: (el) => {
    S.q = el.value;
    refreshList();
  },
  periode: (el) => {
    if (el.value) {
      S.periode = el.value;
      render();
    }
  },
  kasf: (el) => {
    if (el.value) {
      S.kasFilter = el.value;
      render();
    }
  },
  payamt: (el) => {
    const mx = +el.dataset.max;
    if (+el.value > mx && mx > 0 && false) el.value = mx;
    recalcPay();
  },
  jenis: (el) => {
    const f = el.form;
    f.nominal.value = tarif(el.value === 'Kematian' ? 'tali_kematian' : 'tali_sakit');
  },
  taliwarga: (el) => {
    const o = el.selectedOptions[0];
    const f = el.form;
    if (o && o.dataset.n && (!f.nama.value || f.nama.dataset.auto === '1')) {
      f.nama.value = o.dataset.n;
      f.nama.dataset.auto = '1';
    }
  },
  ctarget: (el) => {
    S.cetak.target = el.value;
    render();
  },
  cwid: (el) => {
    S.cetak.wid = el.value;
    $('#cnt').textContent = `${cetakTargets().length} tagihan akan dicetak untuk ${periodeLabel(S.periode)}.`;
  },
  csize: (el) => {
    S.cetak.size = el.value;
  },
  car: (el) => {
    S.cetak.ar = el.checked;
  },
};
['input', 'change'].forEach((ev) =>
  document.addEventListener(ev, (e) => {
    const b = e.target.dataset && e.target.dataset.bind;
    if (b && BIND[b]) BIND[b](e.target, e);
    if (e.target.name === 'nama' && ev === 'input') e.target.dataset.auto = '0';
  }),
);

/* ---------- Form submit ---------- */
const FORMS = {
  warga: (f) => {
    const fd = new FormData(f),
      id = f.dataset.id || uid();
    const r = {
      id,
      nama: fd.get('nama').trim(),
      alamat: fd.get('alamat').trim(),
      hp: fd.get('hp').trim(),
      pembangunan: fd.get('pembangunan'),
      lingkungan: fd.get('lingkungan'),
      koperasi: fd.get('koperasi') ? 'Ya' : 'Tidak',
      arisan: fd.get('arisan') ? 'Ya' : 'Tidak',
      mulai: fd.get('mulai') || '',
      status: fd.get('status'),
    };
    closeModal();
    persist('Warga', [r]);
    toast('Data warga tersimpan');
  },
  kejadian: (f) => {
    const fd = new FormData(f),
      id = f.dataset.id || uid();
    const r = {
      id,
      tanggal: fd.get('tanggal'),
      jenis: fd.get('jenis'),
      warga_id: fd.get('warga_id'),
      nama: fd.get('nama').trim(),
      periode: fd.get('periode'),
      nominal: +fd.get('nominal') || 0,
      kecualikan: fd.get('kecualikan') ? 'Ya' : 'Tidak',
      keterangan: fd.get('keterangan').trim(),
    };
    closeModal();
    persist('Kejadian', [r]);
    toast('Kejadian Tali Asih tersimpan');
  },
  kas: (f) => {
    const fd = new FormData(f),
      id = f.dataset.id || uid();
    closeModal();
    persist('KasRT', [{ id, tanggal: fd.get('tanggal'), tipe: fd.get('tipe'), kategori: fd.get('kategori'), keterangan: fd.get('keterangan').trim(), jumlah: +fd.get('jumlah') || 0 }]);
    toast('Transaksi kas tersimpan');
  },
  setting: (f) => {
    const fd = new FormData(f);
    const tr = S.D.Tarif.map((t) => ({ id: t.id, label: t.label, nominal: +fd.get('t_' + t.id) || 0 }));
    const st = S.D.Pengaturan.map((s) => ({ id: s.id, nilai: String(fd.get('s_' + s.id) ?? s.nilai) }));
    persist('Tarif', tr);
    persist('Pengaturan', st);
    toast('Pengaturan tersimpan');
  },
};
document.addEventListener('submit', (e) => {
  const f = e.target;
  if (f.dataset.form) {
    e.preventDefault();
    FORMS[f.dataset.form](f);
  }
});

/* ---------- Login & mulai ---------- */
async function enter(pin, url, remember) {
  CFG.url = url.trim();
  CFG.pin = pin;
  CFG.demo = !CFG.url;
  $('#loginBtn').disabled = true;
  $('#loginBtn').textContent = 'Memeriksa…';
  $('#loginErr').hidden = true;
  try {
    await loadAll(true);
    localStorage.setItem('rt_url', CFG.url);
    if (!CFG.demo) {
      sessionStorage.setItem('rt_pin', pin);
      if (remember) localStorage.setItem('rt_pin', pin);
    }
    $('#login').hidden = true;
    $('#app').hidden = false;
    render();
  } catch (e) {
    $('#loginErr').textContent = CFG.demo ? e.message : 'Gagal masuk: ' + e.message + (/fetch|network/i.test(e.message) ? ' — periksa URL Web App dan koneksi internet.' : '');
    $('#loginErr').hidden = false;
    $('#cfgBox').open = !CFG.demo && /URL|fetch|network|JSON|Unexpected/i.test(e.message);
  } finally {
    $('#loginBtn').disabled = false;
    $('#loginBtn').textContent = 'Masuk';
  }
}
$('#loginForm').addEventListener('submit', (e) => {
  e.preventDefault();
  enter($('#pin').value, $('#apiurl').value, $('#remember').checked);
});
(function boot() {
  const url = localStorage.getItem('rt_url') || DEFAULT_API_URL;
  $('#apiurl').value = url;
  const pin = localStorage.getItem('rt_pin') || sessionStorage.getItem('rt_pin');
  if (url && pin) enter(pin, url, true);
  else if (!url) $('#cfgBox').open = true;
})();
