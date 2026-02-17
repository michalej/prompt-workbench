import { Link } from 'react-router-dom';

export default function PromptCard({ prompt, onDelete, onDuplicate }) {
  const versionCount = prompt.versions?.length || 0;
  const date = new Date(prompt.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="card group hover:border-indigo-500/30 transition-all duration-300">
      <div className="flex items-start justify-between mb-3">
        <Link to={`/prompt/${prompt._id}`} className="flex-1">
          <h3 className="font-semibold text-gray-100 group-hover:text-indigo-300 transition-colors text-lg">
            {prompt.name}
          </h3>
        </Link>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onDuplicate(prompt._id)} className="p-1.5 rounded-lg hover:bg-navy-700 text-gray-500 hover:text-gray-300" title="Duplicate">
            📋
          </button>
          <button onClick={() => onDelete(prompt._id)} className="p-1.5 rounded-lg hover:bg-red-900/30 text-gray-500 hover:text-red-400" title="Delete">
            🗑️
          </button>
        </div>
      </div>
      {prompt.description && (
        <p className="text-gray-400 text-sm mb-3 line-clamp-2">{prompt.description}</p>
      )}
      <div className="flex items-center gap-3 text-xs text-gray-500">
        <span className="badge bg-indigo-600/20 text-indigo-400">v{versionCount}</span>
        {prompt.tags?.map(tag => (
          <span key={tag} className="badge bg-purple-600/20 text-purple-400">{tag}</span>
        ))}
        <span className="ml-auto">{date}</span>
      </div>
    </div>
  );
}
