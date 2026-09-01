import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BookOpen,
  CalendarDays,
  Check,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  LayoutDashboard,
  Plus,
  Save,
  Sparkles,
  Trash2,
  TrendingDown,
  TrendingUp,
  WalletCards,
  Wrench,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type EntryType = "profit" | "loss";

type JournalEntry = {
  type: EntryType;
  amount: number;
  note: string;
  token: string;
  maintenance: boolean;
};

type JournalEntries = Record<string, JournalEntry>;

const STORAGE_KEY = "benz-crypto-journal";
const MONTHS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];
const WEEKDAYS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
const YEARS = [2026, 2027, 2028, 2029, 2030];
const initialEntries: JournalEntries = {
  "2026-01-03": { type: "profit", amount: 425000, token: "BTC/IDR", maintenance: false, note: "Take profit BTC" },
  "2026-01-08": { type: "loss", amount: -180000, token: "SOL/IDR", maintenance: false, note: "Cut loss altcoin" },
  "2026-01-12": { type: "profit", amount: 680000, token: "BTC/IDR", maintenance: false, note: "Profit trading harian" },
  "2026-01-15": { type: "loss", amount: -90000, token: "ADA/IDR", maintenance: true, note: "Loss saat token maintenance" },
  "2026-01-21": { type: "profit", amount: 320000, token: "ETH/IDR", maintenance: false, note: "Swing trade ETH" },
};

function dateKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function formatRupiah(value: number, withSign = false) {
  const sign = withSign ? (value > 0 ? "+" : value < 0 ? "−" : "") : "";
  return `${sign}Rp ${Math.abs(value).toLocaleString("id-ID")}`;
}

function formatShortRupiah(value: number) {
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  const absolute = Math.abs(value);
  if (absolute >= 1000000) return `${sign}Rp ${(absolute / 1000000).toFixed(1).replace(".0", "")} jt`;
  if (absolute >= 1000) return `${sign}Rp ${Math.round(absolute / 1000)} rb`;
  return `${sign}Rp ${absolute.toLocaleString("id-ID")}`;
}

function typeLabel(type: EntryType) {
  return type === "profit" ? "Profit" : "Loss";
}

function loadEntries(): JournalEntries {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return initialEntries;
    const parsed = JSON.parse(saved) as Record<string, { type?: string; amount?: number; token?: string; maintenance?: boolean; note?: string }>;
    return {
      ...initialEntries,
      ...Object.fromEntries(Object.entries(parsed).map(([key, entry]) => [key, {
        type: entry.type === "loss" ? "loss" : "profit",
        amount: Number(entry.amount) || 0,
        token: entry.token ?? "",
        maintenance: Boolean(entry.maintenance) || entry.type === "maintenance",
        note: entry.note ?? "",
      }])),
    };
  } catch {
    return initialEntries;
  }
}

export default function Index() {
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(0);
  const [selectedDate, setSelectedDate] = useState("2026-01-12");
  const [entries, setEntries] = useState<JournalEntries>(loadEntries);
  const [entryType, setEntryType] = useState<EntryType>("profit");
  const [amount, setAmount] = useState("680000");
  const [token, setToken] = useState("BTC/IDR");
  const [maintenance, setMaintenance] = useState(false);
  const [note, setNote] = useState("Profit trading harian");
  const [isMobilePanelOpen, setIsMobilePanelOpen] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }, [entries]);

  const selectedEntry = entries[selectedDate];
  const calendarCells = useMemo(() => {
    const firstDayMonday = (new Date(year, month, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const totalCells = Math.ceil((firstDayMonday + daysInMonth) / 7) * 7;
    return Array.from({ length: totalCells }, (_, index) => {
      const day = index - firstDayMonday + 1;
      const isCurrentMonth = day > 0 && day <= daysInMonth;
      const cellDate = new Date(year, month, isCurrentMonth ? day : day < 1 ? 1 : daysInMonth);
      if (!isCurrentMonth) cellDate.setDate(cellDate.getDate() + (day < 1 ? day - 1 : day - daysInMonth));
      return {
        day: cellDate.getDate(),
        key: dateKey(cellDate.getFullYear(), cellDate.getMonth(), cellDate.getDate()),
        isCurrentMonth,
      };
    });
  }, [month, year]);

  const monthlyEntries = useMemo(
    () => Object.entries(entries).filter(([key]) => key.startsWith(`${year}-${String(month + 1).padStart(2, "0")}`)),
    [entries, month, year],
  );
  const monthlyProfit = monthlyEntries.reduce((sum, [, entry]) => sum + (entry.type === "profit" ? entry.amount : 0), 0);
  const monthlyLoss = monthlyEntries.reduce((sum, [, entry]) => sum + (entry.type === "loss" ? Math.abs(entry.amount) : 0), 0);
  const monthlyNet = monthlyProfit - monthlyLoss;
  const maintenanceCount = monthlyEntries.filter(([, entry]) => entry.maintenance).length;
  const yearlyNet = Object.values(entries).reduce((sum, entry) => sum + entry.amount, 0);

  function selectDate(key: string) {
    setSelectedDate(key);
    const current = entries[key];
    setEntryType(current?.type ?? "profit");
    setAmount(current ? String(Math.abs(current.amount)) : "");
    setToken(current?.token ?? "");
    setMaintenance(current?.maintenance ?? false);
    setNote(current?.note ?? "");
    setIsMobilePanelOpen(true);
  }

  function changeMonth(direction: number) {
    const next = month + direction;
    let nextYear = year;
    let nextMonth = month;
    if (next < 0 && year > YEARS[0]) {
      nextYear = year - 1;
      nextMonth = 11;
    } else if (next > 11 && year < YEARS[YEARS.length - 1]) {
      nextYear = year + 1;
      nextMonth = 0;
    } else if (next >= 0 && next <= 11) {
      nextMonth = next;
    }
    setYear(nextYear);
    setMonth(nextMonth);
    selectDate(dateKey(nextYear, nextMonth, 1));
  }

  function saveEntry() {
    const numericAmount = Number(amount) || 0;
    const signedAmount = entryType === "loss" ? -Math.abs(numericAmount) : Math.abs(numericAmount);
    setEntries((current) => ({ ...current, [selectedDate]: { type: entryType, amount: signedAmount, token: token.trim().toUpperCase(), maintenance, note: note.trim() } }));
    setSavedNotice(true);
    window.setTimeout(() => setSavedNotice(false), 1800);
  }

  function deleteEntry() {
    setEntries((current) => {
      const next = { ...current };
      delete next[selectedDate];
      return next;
    });
    setEntryType("profit");
    setAmount("");
    setToken("");
    setMaintenance(false);
    setNote("");
  }

  const selectedDay = Number(selectedDate.slice(-2));
  const selectedYear = Number(selectedDate.slice(0, 4));
  const selectedMonthLabel = MONTHS[Number(selectedDate.slice(5, 7)) - 1];

  return (
    <main className="min-h-screen bg-ink text-cloud">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="hidden w-[238px] shrink-0 flex-col border-r border-line bg-[#101513] px-5 py-7 lg:flex">
          <div className="flex items-center gap-3 px-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-mint text-ink shadow-[0_0_24px_rgba(98,226,190,0.18)]">
              <WalletCards size={21} strokeWidth={2.4} />
            </div>
            <div>
              <p className="font-display text-[15px] font-bold tracking-tight">BENZ</p>
              <p className="text-[9px] font-semibold uppercase tracking-[0.24em] text-muted">Crypto journal</p>
            </div>
          </div>

          <div className="mt-14">
            <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-muted">Workspace</p>
            <nav className="space-y-1">
              <button className="flex w-full items-center gap-3 rounded-xl bg-[#1b2925] px-3 py-3 text-left text-sm font-semibold text-mint">
                <CalendarDays size={17} /> Kalender
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-mint" />
              </button>
              <button className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-muted transition hover:bg-[#18221f] hover:text-cloud">
                <LayoutDashboard size={17} /> Ringkasan
              </button>
              <button className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-muted transition hover:bg-[#18221f] hover:text-cloud">
                <BookOpen size={17} /> Catatan
              </button>
            </nav>
          </div>

          <div className="mt-auto rounded-2xl border border-line bg-[#151d1a] p-4">
            <div className="mb-4 flex items-center justify-between">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#243d35] text-mint"><Sparkles size={15} /></span>
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">2026 — 2030</span>
            </div>
            <p className="text-xs font-semibold text-cloud">Jaga ritme tradingmu.</p>
            <p className="mt-1 text-[11px] leading-relaxed text-muted">Catat setiap keputusan. Lihat pola. Tumbuh konsisten.</p>
          </div>
        </aside>

        <section className="min-w-0 flex-1">
          <header className="flex h-[76px] items-center justify-between border-b border-line px-5 sm:px-8 lg:px-10">
            <div className="flex items-center gap-3 lg:hidden">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-mint text-ink"><WalletCards size={18} /></div>
              <span className="font-display text-sm font-bold">BENZ</span>
            </div>
            <div className="hidden items-center gap-2 text-xs text-muted sm:flex"><span className="h-1.5 w-1.5 rounded-full bg-mint" /> Semua catatan tersimpan lokal</div>
            <div className="ml-auto flex items-center gap-3">
              <div className="rounded-full border border-[#3e594d] bg-[#17231f] px-3.5 py-2 text-xs font-bold text-lime sm:px-4"><span className="mr-1.5 text-muted">BUY</span> Rp 5 jt</div>
              <div className="hidden h-9 w-9 items-center justify-center rounded-full bg-[#d9f59c] text-xs font-black text-ink sm:flex">BZ</div>
            </div>
          </header>

          <div className="px-5 pb-10 pt-8 sm:px-8 lg:px-10 lg:pt-10">
            <div className="mb-9 flex flex-col justify-between gap-6 xl:flex-row xl:items-end">
              <div>
                <p className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.19em] text-mint"><span className="h-px w-6 bg-mint" /> Trading diary</p>
                <h1 className="font-display text-[34px] font-bold leading-[1.05] tracking-[-0.04em] text-cloud sm:text-[46px]">Maintenance <span className="text-mint">Event</span></h1>
                <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">Catat profit &amp; loss token Indodax.</p>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:min-w-[560px]">
                <StatCard label="Net bulan ini" value={formatShortRupiah(monthlyNet)} accent={monthlyNet >= 0 ? "mint" : "coral"} icon={<BarChart3 size={15} />} />
                <StatCard label="Total profit" value={formatShortRupiah(monthlyProfit)} accent="mint" icon={<TrendingUp size={15} />} />
                <StatCard label="Total loss" value={formatShortRupiah(monthlyLoss)} accent="coral" icon={<TrendingDown size={15} />} />
                <StatCard label="Token maintenance" value={`${maintenanceCount} token`} accent="gold" icon={<Wrench size={15} />} />
              </div>
            </div>

            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_330px]">
              <div className="rounded-2xl border border-line bg-panel p-4 sm:p-6">
                <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted">Jurnal kalender</p>
                    <div className="mt-2 flex items-center gap-3">
                      <h2 className="font-display text-2xl font-bold tracking-[-0.03em]">{MONTHS[month]} <span className="text-mint">{year}</span></h2>
                      <div className="relative">
                        <select value={year} onChange={(event) => { const nextYear = Number(event.target.value); setYear(nextYear); selectDate(dateKey(nextYear, month, 1)); }} className="appearance-none rounded-lg border border-line bg-[#18211e] py-1.5 pl-3 pr-8 text-xs font-bold text-muted outline-none transition focus:border-mint">
                          {YEARS.map((item) => <option key={item} value={item}>{item}</option>)}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-2 top-2.5 text-muted" size={13} />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => changeMonth(-1)} disabled={month === 0 && year === YEARS[0]} className="flex h-9 w-9 items-center justify-center rounded-lg border border-line text-muted transition hover:border-mint hover:text-mint disabled:cursor-not-allowed disabled:opacity-30" aria-label="Bulan sebelumnya"><ArrowLeft size={16} /></button>
                    <button onClick={() => { setYear(2026); setMonth(0); selectDate("2026-01-01"); }} className="hidden rounded-lg border border-line px-3 py-2 text-xs font-semibold text-muted transition hover:border-mint hover:text-mint sm:block">Awal jurnal</button>
                    <button onClick={() => changeMonth(1)} disabled={month === 11 && year === YEARS[YEARS.length - 1]} className="flex h-9 w-9 items-center justify-center rounded-lg border border-line text-muted transition hover:border-mint hover:text-mint disabled:cursor-not-allowed disabled:opacity-30" aria-label="Bulan berikutnya"><ArrowRight size={16} /></button>
                  </div>
                </div>

                <div className="mb-2 grid grid-cols-7 border-b border-line pb-3">
                  {WEEKDAYS.map((day, index) => <div key={day} className={`text-center text-[10px] font-bold uppercase tracking-[0.12em] ${index > 4 ? "text-mint/70" : "text-muted"}`}>{day}</div>)}
                </div>
                <div className="grid grid-cols-7">
                  {calendarCells.map((cell) => {
                    const entry = entries[cell.key];
                    const isSelected = selectedDate === cell.key;
                    return <button key={cell.key} onClick={() => selectDate(cell.key)} className={`group relative min-h-[82px] border-b border-r border-line p-2 text-left transition sm:min-h-[104px] sm:p-3 ${!cell.isCurrentMonth ? "bg-[#101714]/50 text-[#52625a]" : "text-cloud hover:bg-[#1b2925]"} ${isSelected ? "bg-[#1d332c] ring-1 ring-inset ring-mint" : ""}`}>
                      <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${isSelected ? "bg-mint font-black text-ink" : cell.isCurrentMonth ? "text-cloud" : "text-[#52625a]"}`}>{cell.day}</span>
                      {entry && <div className={`mt-2 truncate rounded-md px-1.5 py-1 text-[10px] font-bold sm:text-[11px] ${entry.type === "profit" ? "bg-[#183b32] text-mint" : "bg-[#3c2428] text-coral"}`}>
                        <span className="block truncate text-[9px] opacity-70">{entry.token || "Token"}</span><span>{formatShortRupiah(entry.amount)}</span>{entry.maintenance && <span className="ml-1.5 rounded bg-[#4b4125] px-1 text-[9px] text-gold">M</span>}
                      </div>}
                      {!entry && cell.isCurrentMonth && <span className="absolute bottom-3 right-3 hidden text-muted opacity-0 transition group-hover:opacity-100 sm:block"><Plus size={14} /></span>}
                    </button>;
                  })}
                </div>
                <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] font-medium text-muted">
                  <span className="flex items-center gap-2"><i className="h-2 w-2 rounded-full bg-mint" /> Profit</span>
                  <span className="flex items-center gap-2"><i className="h-2 w-2 rounded-full bg-coral" /> Loss</span>
                  <span className="flex items-center gap-2"><i className="h-2 w-2 rounded-full bg-gold" /> Token maintenance</span>
                  <span className="ml-auto hidden items-center gap-1.5 sm:flex"><Clock3 size={13} /> Data tersimpan otomatis</span>
                </div>
              </div>

              <aside className={`${isMobilePanelOpen ? "fixed inset-x-4 bottom-4 z-20 max-h-[80vh] overflow-y-auto shadow-2xl sm:inset-x-auto sm:right-8 sm:w-[330px]" : "hidden xl:block"} rounded-2xl border border-line bg-[#151e1b] p-5`}>
                <div className="mb-6 flex items-start justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted">Detail tanggal</p>
                    <h3 className="mt-1 font-display text-xl font-bold">{selectedDay} {selectedMonthLabel}</h3>
                    <p className="mt-1 text-xs text-muted">{selectedYear} · Profit/loss harian</p>
                  </div>
                  <button onClick={() => setIsMobilePanelOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-[#22302a] hover:text-cloud xl:hidden" aria-label="Tutup detail"><X size={17} /></button>
                </div>

                <div className="mb-5 flex gap-1 rounded-xl bg-[#0e1512] p-1">
                  {(["profit", "loss"] as EntryType[]).map((item) => <button key={item} onClick={() => setEntryType(item)} className={`flex-1 rounded-lg px-2 py-2 text-[10px] font-bold transition ${entryType === item ? item === "profit" ? "bg-[#21483b] text-mint" : "bg-[#4a282e] text-coral" : "text-muted hover:text-cloud"}`}>{typeLabel(item)}</button>)}
                </div>

                <label className="mb-4 block">
                  <span className="mb-2 block text-[11px] font-semibold text-muted">Token</span>
                  <input value={token} onChange={(event) => setToken(event.target.value)} placeholder="Contoh: BTC/IDR" className="w-full rounded-xl border border-line bg-[#101714] px-3 py-3 text-sm font-semibold uppercase text-cloud outline-none transition placeholder:normal-case placeholder:text-[#53645b] focus:border-mint" />
                </label>
                <label className="mb-4 flex cursor-pointer items-center gap-3 rounded-xl border border-[#4b4125] bg-[#2b2719] px-3 py-3">
                  <input type="checkbox" checked={maintenance} onChange={(event) => setMaintenance(event.target.checked)} className="h-4 w-4 accent-[#e9c66a]" />
                  <span><span className="block text-xs font-bold text-gold">Token sedang maintenance</span><span className="mt-0.5 block text-[10px] text-[#ae9860]">Profit/loss tetap tercatat selama status ini aktif.</span></span>
                </label>
                <label className="mb-5 block">
                  <span className="mb-2 block text-[11px] font-semibold text-muted">Nominal</span>
                  <div className="flex items-center rounded-xl border border-line bg-[#101714] px-3 transition focus-within:border-mint">
                    <span className="mr-2 text-xs text-muted">Rp</span>
                    <input value={amount} onChange={(event) => setAmount(event.target.value.replace(/[^0-9]/g, ""))} inputMode="numeric" placeholder="0" className="w-full bg-transparent py-3 text-sm font-semibold text-cloud outline-none placeholder:text-[#53645b]" />
                  </div>
                </label>
                <label className="mb-5 block">
                  <span className="mb-2 block text-[11px] font-semibold text-muted">Catatan</span>
                  <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={3} placeholder="Tulis catatan singkat..." className="w-full resize-none rounded-xl border border-line bg-[#101714] px-3 py-3 text-sm text-cloud outline-none transition placeholder:text-[#53645b] focus:border-mint" />
                </label>
                <div className="flex gap-2">
                  {selectedEntry && <button onClick={deleteEntry} className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#56343a] text-coral transition hover:bg-[#3b252a]" aria-label="Hapus catatan"><Trash2 size={16} /></button>}
                  <button onClick={saveEntry} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-mint px-4 text-xs font-black text-ink transition hover:bg-[#87edcd]">{savedNotice ? <><Check size={15} /> Tersimpan</> : <><Save size={15} /> Simpan catatan</>}</button>
                </div>
                <div className="mt-6 border-t border-line pt-4">
                  <p className="flex items-center justify-between text-[11px] text-muted"><span>Total net {MONTHS[month]}</span><strong className={monthlyNet >= 0 ? "text-mint" : "text-coral"}>{formatRupiah(monthlyNet, true)}</strong></p>
                  <p className="mt-2 flex items-center justify-between text-[11px] text-muted"><span>Net seluruh jurnal</span><strong className={yearlyNet >= 0 ? "text-mint" : "text-coral"}>{formatShortRupiah(yearlyNet)}</strong></p>
                </div>
              </aside>
            </div>

            <footer className="mt-10 flex flex-col justify-between gap-3 border-t border-line pt-5 text-[11px] text-muted sm:flex-row sm:items-center">
              <p>© 2026 BENZ · Crypto Journal</p>
              <p className="flex items-center gap-2"><CircleDollarSign size={13} className="text-mint" /> Trading dengan catatan, bukan tebakan.</p>
            </footer>
          </div>
        </section>
      </div>
    </main>
  );
}

function StatCard({ label, value, accent, icon }: { label: string; value: string; accent: "mint" | "coral" | "gold"; icon: React.ReactNode }) {
  const color = accent === "mint" ? "text-mint" : accent === "coral" ? "text-coral" : "text-gold";
  return <div className="rounded-xl border border-line bg-panel px-3 py-3.5 sm:px-4"><div className={`mb-2 flex items-center gap-1.5 text-[10px] font-semibold ${color}`}>{icon}<span className="truncate text-muted">{label}</span></div><p className={`font-display text-[15px] font-bold tracking-tight sm:text-base ${color}`}>{value}</p></div>;
}
