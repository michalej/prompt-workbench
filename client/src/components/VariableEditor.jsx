import { useState } from 'react';

export default function VariableEditor({ variables, onChange, values, onValuesChange }) {
  const [newName, setNewName] = useState('');

  const addVariable = () => {
    if (!newName.trim()) return;
    onChange([...variables, { name: newName.trim(), type: 'string', default: '', description: '' }]);
    onValuesChange({ ...values, [newName.trim()]: '' });
    setNewName('');
  };

  const removeVariable = (name) => {
    onChange(variables.filter(v => v.name !== name));
    const newValues = { ...values };
    delete newValues[name];
    onValuesChange(newValues);
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Variables</h3>
      {variables.map(v => (
        <div key={v.name} className="space-y-1">
          <div className="flex items-center gap-2">
            <code className="text-indigo-400 text-xs font-mono bg-indigo-600/10 px-2 py-0.5 rounded">{'{{' + v.name + '}}'}</code>
            <button onClick={() => removeVariable(v.name)} className="text-gray-600 hover:text-red-400 text-xs ml-auto">✕</button>
          </div>
          <textarea
            rows={2}
            className="w-full text-xs !py-1.5"
            placeholder={`Value for ${v.name}...`}
            value={values[v.name] || ''}
            onChange={e => onValuesChange({ ...values, [v.name]: e.target.value })}
          />
        </div>
      ))}
      <div className="flex gap-2">
        <input
          className="flex-1 text-xs !py-1.5"
          placeholder="Variable name"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addVariable()}
        />
        <button onClick={addVariable} className="btn-secondary text-xs !px-3 !py-1.5">Add</button>
      </div>
    </div>
  );
}
