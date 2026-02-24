export default function FilterDropdowns({ 
  filters, 
  category, 
  setCategory, 
  priority, 
  setPriority,
  selectedPerson,
  setSelectedPerson,
  personLabel,
  personType,
  personDisabled = false
}) {
  const personList = personType === 'reporters' ? filters.reporters : filters.agents;

  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    marginBottom: '1rem'
  };

  const rowStyle = {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: '0.75rem'
  };

  const fieldStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    flex: '1 1 auto',
    minWidth: '120px'
  };

  const labelStyle = {
    fontSize: '0.75rem',
    fontWeight: 500,
    color: 'var(--text-secondary)'
  };

  return (
    <div style={containerStyle}>
      <div style={rowStyle}>
        {personList && personType && (
          <div style={fieldStyle}>
            <label style={labelStyle}>{personLabel}</label>
            <select
              value={selectedPerson}
              onChange={(e) => setSelectedPerson(e.target.value)}
              className="filter-select"
              disabled={personDisabled}
              style={personDisabled ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
            >
              <option value="">Bitte wählen...</option>
              {personList.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div style={fieldStyle}>
          <label style={labelStyle}>Kategorie</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="filter-select"
          >
            <option value="all">Alle</option>
            {filters.categories?.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>Priorität</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="filter-select"
          >
            <option value="all">Alle</option>
            {filters.priorities?.map((pri) => (
              <option key={pri.id} value={pri.id}>
                {pri.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
