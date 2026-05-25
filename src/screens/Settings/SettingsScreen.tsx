import { useApp } from '../../context/AppContext';
import { useDb } from '../../hooks/useDb';
import { Button, SegToggle } from '../../components/UI';
import { METHODS } from '../../utils/methodDefaults';
import { db as dexieDb } from '../../db/schema';

function SettingRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="row row-between" style={{ gap: 16 }}>
      <span style={{ fontSize: 13 }}>{label}</span>
      {children}
    </div>
  );
}

export function SettingsScreen() {
  const { state } = useApp();
  const db = useDb();
  const s = state.settings;

  const set = async (patch: Partial<typeof s>) => {
    await db.updateSettings(patch);
  };

  const handleExport = async () => {
    const data = await db.exportAll();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `brewlog-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const text = await file.text();
      try {
        const data = JSON.parse(text);
        if (confirm('Replace current data with import?')) {
          await dexieDb.beans.clear(); await dexieDb.beans.bulkAdd(data.beans ?? []);
          await dexieDb.equipment.clear(); await dexieDb.equipment.bulkAdd(data.equipment ?? []);
          await dexieDb.recipes.clear(); await dexieDb.recipes.bulkAdd(data.recipes ?? []);
          await dexieDb.extractions.clear(); await dexieDb.extractions.bulkAdd(data.extractions ?? []);
          window.location.reload();
        }
      } catch { alert('Invalid JSON.'); }
    };
    input.click();
  };

  const handleClear = async () => {
    if (confirm('Reset all BrewLog data to seed? This cannot be undone.')) {
      await dexieDb.beans.clear(); await dexieDb.equipment.clear();
      await dexieDb.recipes.clear(); await dexieDb.extractions.clear();
      await dexieDb.settings.clear();
      window.location.reload();
    }
  };

  if (!s) return null;

  return (
    <div>
      <div className="page-head">
        <h1>Settings</h1>
        <p>PREFERENCES &amp; DATA</p>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="t-upper" style={{ marginBottom: 16 }}>Units</div>
        <div className="col col-gap-16">
          <SettingRow label="Weight"><SegToggle value={s.weightUnit} options={[['g','grams'],['oz','ounces']]} onChange={v => set({ weightUnit: v as 'g'|'oz' })} /></SettingRow>
          <SettingRow label="Temperature"><SegToggle value={s.tempUnit} options={[['C','°C'],['F','°F']]} onChange={v => set({ tempUnit: v as 'C'|'F' })} /></SettingRow>
          <SettingRow label="Volume"><SegToggle value={s.volumeUnit} options={[['ml','ml'],['oz','fl oz']]} onChange={v => set({ volumeUnit: v as 'ml'|'oz' })} /></SettingRow>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="t-upper" style={{ marginBottom: 16 }}>Defaults</div>
        <div className="col col-gap-16">
          <SettingRow label="Default method">
            <select className="input-underline" style={{ minWidth: 140 }} value={s.defaultMethod} onChange={e => set({ defaultMethod: e.target.value })}>
              {METHODS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </SettingRow>
          <SettingRow label="Rating scale">
            <SegToggle value={s.ratingScale} options={[['5','5 stars'],['10','1–10']]} onChange={v => set({ ratingScale: v as '5'|'10' })} />
          </SettingRow>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="t-upper" style={{ marginBottom: 16 }}>Appearance</div>
        <SettingRow label="Theme">
          <SegToggle value={s.theme} options={[['system','System'],['light','Light'],['dark','Dark']]} onChange={v => set({ theme: v as 'system'|'light'|'dark' })} />
        </SettingRow>
      </div>

      <div className="card">
        <div className="t-upper" style={{ marginBottom: 16 }}>Data</div>
        <div className="col col-gap-12">
          <Button variant="ghost" full leftIcon="download" onClick={handleExport}>Export JSON</Button>
          <Button variant="ghost" full leftIcon="upload" onClick={handleImport}>Import JSON</Button>
          <Button variant="danger" full leftIcon="trash" onClick={handleClear}>Clear all data</Button>
        </div>
      </div>
    </div>
  );
}
