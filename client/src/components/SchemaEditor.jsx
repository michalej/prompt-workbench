export default function SchemaEditor({ schema, onChange, enabled, onToggle }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Output Schema</h3>
        <button
          onClick={onToggle}
          className={`text-xs px-2 py-1 rounded-full transition-all ${
            enabled
              ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
              : 'bg-navy-800 text-gray-500'
          }`}
        >
          {enabled ? 'ON' : 'OFF'}
        </button>
      </div>
      {enabled && (
        <textarea
          rows={8}
          className="w-full text-xs font-mono"
          placeholder='{"type":"object","properties":{...}}'
          value={schema || ''}
          onChange={e => onChange(e.target.value)}
        />
      )}
    </div>
  );
}
