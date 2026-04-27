import { X, Filter, ChevronsDown, ChevronsUp, Search } from 'lucide-react';

export function KanbanFilters({ 
  filters, 
  selectedFilters, 
  onFilterChange, 
  onClear, 
  grouping, 
  onGroupingChange,
  allCollapsed,
  onToggleAll,
  searchTerm,
  onSearchChange
}) {
  const containerStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.75rem',
    alignItems: 'center',
    padding: '0.75rem',
    backgroundColor: 'var(--bg-secondary)',
    borderRadius: '0.5rem',
    marginBottom: '1rem',
    border: '1px solid var(--border-color)'
  };

  const selectStyle = {
    padding: '0.5rem 2rem 0.5rem 0.75rem',
    borderRadius: '0.375rem',
    border: '1px solid var(--border-color)',
    backgroundColor: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    fontSize: '0.875rem',
    cursor: 'pointer',
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 0.5rem center',
    minWidth: '140px'
  };

  const labelStyle = {
    fontSize: '0.75rem',
    fontWeight: 500,
    color: 'var(--text-secondary)',
    marginBottom: '0.25rem'
  };

  const searchInputStyle = {
    padding: '0.5rem 0.75rem 0.5rem 2rem',
    borderRadius: '0.375rem',
    border: '1px solid var(--border-color)',
    backgroundColor: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    fontSize: '0.875rem',
    width: '200px',
    outline: 'none'
  };

  const buttonStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
    padding: '0.5rem 0.75rem',
    borderRadius: '0.375rem',
    border: '1px solid var(--border-color)',
    backgroundColor: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    cursor: 'pointer',
    fontSize: '0.75rem',
    transition: 'background-color 0.2s'
  };

  const activeFilters = Object.entries(selectedFilters).filter(([, value]) => value && value !== 'all');

  return (
    <div style={containerStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginRight: '0.5rem' }}>
        <Filter size={16} style={{ color: 'var(--text-secondary)' }} />
        <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>Filter</span>
      </div>

      <div>
        <div style={labelStyle}>Suche</div>
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: '0.5rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input
            type="text"
            value={searchTerm || ''}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Ticket suchen..."
            style={searchInputStyle}
          />
        </div>
      </div>

      <div>
        <div style={labelStyle}>Kategorie</div>
        <select
          value={selectedFilters.category || 'all'}
          onChange={(e) => onFilterChange('category', e.target.value)}
          style={selectStyle}
        >
          <option value="all">Alle Kategorien</option>
          {filters?.categories?.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>

      <div>
        <div style={labelStyle}>Priorität</div>
        <select
          value={selectedFilters.priority || 'all'}
          onChange={(e) => onFilterChange('priority', e.target.value)}
          style={selectStyle}
        >
          <option value="all">Alle Prioritäten</option>
          {filters?.priorities?.map(pri => (
            <option key={pri.id} value={pri.id}>{pri.name}</option>
          ))}
        </select>
      </div>

      <div>
        <div style={labelStyle}>Agent</div>
        <select
          value={selectedFilters.agent || 'all'}
          onChange={(e) => onFilterChange('agent', e.target.value)}
          style={selectStyle}
        >
          <option value="all">Alle Agenten</option>
          {filters?.agents?.map(ag => (
            <option key={ag.id} value={ag.id}>{ag.name}</option>
          ))}
        </select>
      </div>

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'flex-end', gap: '0.5rem' }}>
        <div>
          <div style={labelStyle}>Gruppierung in Spalten</div>
          <select
            value={grouping}
            onChange={(e) => onGroupingChange(e.target.value)}
            style={selectStyle}
          >
            <option value="category">Nach Kategorie</option>
            <option value="priority">Nach Priorität</option>
            <option value="agent">Nach Agent</option>
            <option value="none">Keine Gruppierung</option>
          </select>
        </div>

        {grouping !== 'none' && (
          <button
            onClick={onToggleAll}
            style={buttonStyle}
            title={allCollapsed ? 'Alle Gruppen aufklappen' : 'Alle Gruppen zuklappen'}
          >
            {allCollapsed ? (
              <>
                <ChevronsDown size={14} />
                <span>Alle auf</span>
              </>
            ) : (
              <>
                <ChevronsUp size={14} />
                <span>Alle zu</span>
              </>
            )}
          </button>
        )}

        {activeFilters.length > 0 && (
          <button
            onClick={onClear}
            style={buttonStyle}
          >
            <X size={14} />
            Zurücksetzen
          </button>
        )}
      </div>
    </div>
  );
}
