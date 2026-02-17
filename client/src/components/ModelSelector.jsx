import { useState, useEffect } from 'react';
import { api } from '../lib/api';

const PROVIDER_COLORS = {
  'anthropic': 'text-orange-400',
  'openai': 'text-green-400',
  'google': 'text-blue-400',
  'meta-llama': 'text-purple-400',
  'deepseek': 'text-cyan-400',
  'mistralai': 'text-red-400',
  'xai': 'text-yellow-400',
  'cohere': 'text-pink-400',
  'perplexity': 'text-emerald-400',
  'qwen': 'text-amber-400',
};

function getProviderColor(modelId) {
  const provider = modelId.split('/')[0];
  return PROVIDER_COLORS[provider] || 'text-gray-400';
}

function getShortName(model) {
  const name = model.name || model.id;
  // Remove provider prefix if in name
  return name.replace(/^[^/]+\//, '');
}

export default function ModelSelector({ selected, onChange, temperature, onTemperatureChange }) {
  const [allModels, setAllModels] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => { loadModels(); }, []);

  async function loadModels(refresh = false) {
    setLoading(true);
    try {
      const url = refresh ? '/models?refresh=true' : '/models';
      const data = await api.getModels(refresh);
      // Sort by provider, filter chat models
      const chatModels = (Array.isArray(data) ? data : [])
        .filter(m => m.id && !m.id.includes(':free') || true) // keep all
        .sort((a, b) => a.id.localeCompare(b.id));
      setAllModels(chatModels);
    } catch (e) { console.error('Failed to load models', e); }
    setLoading(false);
  }

  const toggle = (modelId) => {
    const existing = selected.find(m => m.model === modelId);
    if (existing) {
      onChange(selected.filter(m => m.model !== modelId));
    } else {
      onChange([...selected, { model: modelId, webSearch: false, temperature: temperature ?? 0.7 }]);
    }
  };

  const toggleWebSearch = (modelId) => {
    onChange(selected.map(m => m.model === modelId ? { ...m, webSearch: !m.webSearch } : m));
  };

  const filteredModels = search
    ? allModels.filter(m => m.id.toLowerCase().includes(search.toLowerCase()) || (m.name || '').toLowerCase().includes(search.toLowerCase()))
    : allModels;

  const displayModels = showAll ? filteredModels : filteredModels.slice(0, 30);

  // Selected models always shown on top
  const selectedModels = selected.map(s => {
    const full = allModels.find(m => m.id === s.model);
    return { id: s.model, name: full?.name || s.model, ...s };
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Models</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => loadModels(true)}
            disabled={loading}
            className="text-xs px-2 py-0.5 rounded bg-navy-800 text-gray-400 hover:text-white transition-all"
            title="Refresh model list from OpenRouter"
          >
            {loading ? '⏳' : '🔄'} Refresh
          </button>
        </div>
      </div>

      {/* Temperature */}
      <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
        <span>Temp:</span>
        <input
          type="range" min="0" max="2" step="0.1"
          value={temperature ?? 0.7}
          onChange={e => onTemperatureChange(parseFloat(e.target.value))}
          className="w-24 accent-indigo-500"
        />
        <span className="w-8 text-indigo-400 font-mono">{(temperature ?? 0.7).toFixed(1)}</span>
      </div>

      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search models..."
        className="w-full px-3 py-1.5 rounded-lg bg-navy-900 border border-gray-700 text-sm text-gray-300 placeholder-gray-600 focus:border-indigo-500 outline-none"
      />

      {/* Selected models */}
      {selectedModels.length > 0 && (
        <div className="space-y-1 pb-2 border-b border-gray-700/50">
          <span className="text-[10px] uppercase text-gray-500 tracking-wider">Selected ({selectedModels.length})</span>
          {selectedModels.map(m => (
            <div
              key={m.id}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-600/15 border border-indigo-500/30 text-sm cursor-pointer"
              onClick={() => toggle(m.id)}
            >
              <div className="w-4 h-4 rounded border-2 border-indigo-500 bg-indigo-600 flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
              <span className={`flex-1 truncate ${getProviderColor(m.id)}`}>{m.id}</span>
              <button
                onClick={e => { e.stopPropagation(); toggleWebSearch(m.id); }}
                className={`text-xs px-2 py-0.5 rounded-full transition-all ${
                  m.webSearch
                    ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-600/30'
                    : 'bg-navy-800 text-gray-500 hover:text-gray-400'
                }`}
                title="Web Search"
              >🌐</button>
            </div>
          ))}
        </div>
      )}

      {/* All models list */}
      <div className="max-h-64 overflow-y-auto space-y-0.5 pr-1 scrollbar-thin">
        {loading && allModels.length === 0 && <div className="text-gray-500 text-sm py-4 text-center">Loading models...</div>}
        {displayModels.map(m => {
          const isSelected = selected.some(s => s.model === m.id);
          if (isSelected) return null; // already shown above
          return (
            <div
              key={m.id}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-navy-800 text-sm transition-all"
              onClick={() => toggle(m.id)}
            >
              <div className="w-4 h-4 rounded border-2 border-gray-600 flex-shrink-0" />
              <span className={`flex-1 truncate ${getProviderColor(m.id)}`}>{m.id}</span>
              {m.pricing && (
                <span className="text-[10px] text-gray-600 flex-shrink-0">
                  ${(parseFloat(m.pricing.prompt) * 1000000).toFixed(1)}/M
                </span>
              )}
            </div>
          );
        })}
        {!showAll && filteredModels.length > 30 && (
          <button
            onClick={() => setShowAll(true)}
            className="w-full text-center text-xs text-indigo-400 hover:text-indigo-300 py-2"
          >
            Show all {filteredModels.length} models...
          </button>
        )}
        {search && filteredModels.length === 0 && (
          <div className="text-gray-500 text-sm py-4 text-center">No models matching "{search}"</div>
        )}
      </div>

      <div className="text-[10px] text-gray-600 text-right">{allModels.length} models available</div>
    </div>
  );
}
