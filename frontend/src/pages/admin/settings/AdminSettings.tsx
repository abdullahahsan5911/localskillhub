import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchSettings, updateSettings } from '@/lib/adminApi';
import { Save, DollarSign, LayoutGrid, ShieldAlert, Lock, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// ─── Toggle ───────────────────────────────────────────────────────────────────
function Toggle({
  checked,
  onChange,
  danger = false,
}: {
  checked: boolean;
  onChange: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
        checked
          ? danger
            ? 'bg-red-500 focus-visible:ring-red-400'
            : 'bg-slate-800 focus-visible:ring-slate-500'
          : 'bg-slate-200 focus-visible:ring-slate-400'
      }`}
    >
      <span
        className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-200 ${
          checked ? 'left-5' : 'left-0.5'
        }`}
      />
    </button>
  );
}

// ─── Number Input ─────────────────────────────────────────────────────────────
function NumberInput({
  value,
  onChange,
  min,
  max,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <input
      type="number"
      min={min}
      max={max}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="w-28 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition tabular-nums"
    />
  );
}

// ─── Setting Row — toggle ─────────────────────────────────────────────────────
function ToggleRow({
  label,
  description,
  checked,
  onChange,
  danger,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
  danger?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-6 py-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-900">{label}</p>
        <p className="text-xs text-slate-400 mt-0.5">{description}</p>
      </div>
      <Toggle checked={checked} onChange={onChange} danger={danger} />
    </div>
  );
}

// ─── Setting Row — number input ───────────────────────────────────────────────
function InputRow({
  label,
  description,
  value,
  onChange,
  min,
  max,
}: {
  label: string;
  description?: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div className="flex items-center justify-between gap-6 py-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-900">{label}</p>
        {description && <p className="text-xs text-slate-400 mt-0.5">{description}</p>}
      </div>
      <NumberInput value={value} onChange={onChange} min={min} max={max} />
    </div>
  );
}

// ─── Settings Panel Card ──────────────────────────────────────────────────────
function Panel({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
        <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
          {icon}
        </div>
        <p className="text-sm font-semibold text-slate-900">{title}</p>
      </div>
      <div className="px-6 divide-y divide-slate-100">{children}</div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AdminSettings() {
  const { data: settings, isLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: fetchSettings,
  });
  const [form, setForm] = useState<Record<string, unknown>>({});
  const qc = useQueryClient();
  const { toast } = useToast();

  const formData = { ...settings, ...form };

  const saveMut = useMutation({
    mutationFn: () => updateSettings(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-settings'] });
      toast({ title: 'Settings saved' });
      setForm({});
    },
    onError: () => toast({ title: 'Error', variant: 'destructive' }),
  });

  const set = (key: string, val: unknown) => setForm((f) => ({ ...f, [key]: val }));
  const hasChanges = Object.keys(form).length > 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-7 h-7 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">

      {/* ── Header ── */}
      <div className="flex items-end justify-between pb-4 border-b border-slate-100">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Platform Settings</h1>
          <p className="text-sm text-slate-400 mt-0.5">Control platform behavior without redeploying</p>
        </div>
      </div>

      {/* ── Finance ── */}
      <Panel icon={<DollarSign size={16} />} title="Finance">
        <InputRow
          label="Platform Fee (%)"
          description="Fee applied to all completed contracts"
          value={(formData.platformFeePercentage as number) ?? 3}
          onChange={(v) => set('platformFeePercentage', v)}
          min={0}
          max={50}
        />
        <ToggleRow
          label="Escrow Enabled"
          description="Disable to halt all new escrow payment flows"
          checked={!!formData.escrowEnabled}
          onChange={() => set('escrowEnabled', !formData.escrowEnabled)}
        />
      </Panel>

      {/* ── Marketplace Limits ── */}
      <Panel icon={<LayoutGrid size={16} />} title="Marketplace Limits">
        <InputRow
          label="Max Proposals per Job"
          value={(formData.maxProposalsPerJob as number) ?? 20}
          onChange={(v) => set('maxProposalsPerJob', parseInt(String(v)))}
          min={1}
          max={100}
        />
        <InputRow
          label="Max Active Jobs per Client"
          value={(formData.maxActiveJobsPerClient as number) ?? 10}
          onChange={(v) => set('maxActiveJobsPerClient', parseInt(String(v)))}
          min={1}
          max={100}
        />
      </Panel>

      {/* ── Risk Automation ── */}
      <Panel icon={<ShieldAlert size={16} />} title="Auto Risk Flags">
        <InputRow
          label="Auto-flag after N reports"
          description="Risk level → HIGH after this many user reports"
          value={(formData.autoFlagReportCount as number) ?? 3}
          onChange={(v) => set('autoFlagReportCount', parseInt(String(v)))}
          min={1}
        />
        <InputRow
          label="Auto-flag after N refunds"
          value={(formData.autoFlagRefundCount as number) ?? 3}
          onChange={(v) => set('autoFlagRefundCount', parseInt(String(v)))}
          min={1}
        />
      </Panel>

      {/* ── Platform Access ── */}
      <Panel icon={<Lock size={16} />} title="Platform Access">
        <ToggleRow
          label="Allow New Registrations"
          description="Disable to prevent new users from signing up"
          checked={formData.allowNewRegistrations !== false}
          onChange={() => set('allowNewRegistrations', !formData.allowNewRegistrations)}
        />
        <ToggleRow
          label="Maintenance Mode"
          description="Show a maintenance message to all users"
          checked={!!formData.maintenanceMode}
          onChange={() => set('maintenanceMode', !formData.maintenanceMode)}
          danger
        />

        {formData.maintenanceMode && (
          <div className="py-4">
            <div className="flex items-center gap-1.5 mb-2">
              <AlertCircle size={13} className="text-red-500" />
              <label className="text-xs font-semibold text-red-600">Maintenance Message</label>
            </div>
            <textarea
              value={(formData.maintenanceMessage as string) || ''}
              onChange={(e) => set('maintenanceMessage', e.target.value)}
              rows={2}
              placeholder="Platform is under maintenance. Please check back soon."
              className="w-full bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent resize-none transition"
            />
          </div>
        )}
      </Panel>

      {/* ── Sticky Save Bar ── */}
      {hasChanges && (
        <div className="sticky bottom-4 z-10">
          <div className="bg-white border border-slate-200 rounded-2xl px-5 py-3.5 flex items-center justify-between shadow-lg shadow-slate-200/60">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <p className="text-sm font-medium text-slate-700">You have unsaved changes</p>
            </div>
            <button
              onClick={() => saveMut.mutate()}
              disabled={saveMut.isPending}
              className="flex items-center gap-2 px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold disabled:opacity-50 transition-all duration-150 shadow-sm"
            >
              {saveMut.isPending ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Saving…
                </>
              ) : (
                <>
                  <Save size={14} /> Save Settings
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}