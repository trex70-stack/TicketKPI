import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { KanbanCard } from './KanbanCard';
import { ChevronRight, ChevronDown } from 'lucide-react';

const COLUMN_COLORS = {
  '0': { bg: '#dbeafe', header: '#3b82f6', text: '#1e40af' },
  '20': { bg: '#fef3c7', header: '#f59e0b', text: '#92400e' },
  '80': { bg: '#e0f2fe', header: '#06b6d4', text: '#0e7490' },
  '150': { bg: '#f3e8ff', header: '#a855f7', text: '#7e22ce' },
  '200': { bg: '#dcfce7', header: '#22c55e', text: '#15803d' }
};

export function KanbanColumn({ 
  status, 
  label, 
  tickets, 
  groupBy, 
  allGroups, 
  collapsedGroups, 
  onToggleGroup, 
  isGroupCollapsed,
  searchTerm
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const { setNodeRef: setDropZoneRef, isOver: isOverDropZone } = useDroppable({ 
    id: `dropzone-${status}`,
    data: { status }
  });

  const isOverColumn = isOver || isOverDropZone;

  const colors = COLUMN_COLORS[status] || COLUMN_COLORS['0'];

  const columnStyle = {
    backgroundColor: isOverColumn ? colors.bg : 'var(--bg-tertiary)',
    borderRadius: '0.5rem',
    minWidth: '250px',
    flex: '1 1 250px',
    display: 'flex',
    flexDirection: 'column',
    maxHeight: 'calc(100vh - 200px)',
    transition: 'background-color 0.2s',
    border: isOverColumn ? `2px solid ${colors.header}` : '2px solid transparent'
  };

  const headerStyle = {
    backgroundColor: colors.header,
    color: 'white',
    padding: '0.75rem 1rem',
    borderRadius: '0.5rem 0.5rem 0 0',
    fontWeight: 600,
    fontSize: '0.875rem',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'sticky',
    top: 0,
    zIndex: 1
  };

  const contentStyle = {
    flex: 1,
    padding: '0.5rem',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    minHeight: '80px'
  };

  const dropZoneStyle = {
    height: '20px',
    flexShrink: 0,
    margin: '0 0.5rem',
    borderRadius: '0.375rem',
    transition: 'all 0.2s',
    backgroundColor: isOverColumn ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
    position: 'relative',
    zIndex: 2
  };

  const getGroupTickets = (groupKey) => {
    if (groupBy === 'none') {
      return tickets;
    }
    
    return tickets.filter(ticket => {
      switch (groupBy) {
        case 'category':
          return (ticket.type_id || 'unknown') === groupKey;
        case 'priority':
          return (ticket.priority_id || 'unknown') === groupKey;
        case 'agent':
          return (ticket.agent || 'unassigned') === groupKey;
        default:
          return true;
      }
    });
  };

  const renderGroupedContent = () => {
    if (groupBy === 'none' || allGroups.length === 0) {
      return (
        <SortableContext items={tickets.map(t => t.ticket_id)} strategy={verticalListSortingStrategy}>
          {tickets.map(ticket => (
            <KanbanCard key={ticket.ticket_id} ticket={ticket} highlightText={searchTerm} />
          ))}
          {tickets.length === 0 && (
            <div style={emptyStyle}>Keine Tickets</div>
          )}
        </SortableContext>
      );
    }

    return allGroups.map(group => {
      const groupTickets = getGroupTickets(group.key);
      const isCollapsed = isGroupCollapsed(group.key);
      const isEmpty = groupTickets.length === 0;

      return (
        <div key={group.key} style={groupContainerStyle}>
          <div 
            style={{
              ...groupHeaderStyle,
              opacity: isEmpty ? 0.5 : 1,
              cursor: 'pointer'
            }}
            onClick={() => !isEmpty && onToggleGroup(group.key)}
          >
            {isCollapsed ? (
              <ChevronRight size={14} style={{ color: 'var(--text-secondary)' }} />
            ) : (
              <ChevronDown size={14} style={{ color: 'var(--text-secondary)' }} />
            )}
            <span style={{ flex: 1, fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-primary)' }}>
              {group.label}
            </span>
            <span style={{ 
              fontSize: '0.625rem', 
              backgroundColor: isEmpty ? 'var(--bg-tertiary)' : 'var(--accent-primary)',
              color: isEmpty ? 'var(--text-secondary)' : 'white',
              padding: '0.125rem 0.375rem',
              borderRadius: '0.25rem'
            }}>
              {groupTickets.length}
            </span>
          </div>
          
          {!isCollapsed && (
            <SortableContext items={groupTickets.map(t => t.ticket_id)} strategy={verticalListSortingStrategy}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                {groupTickets.map(ticket => (
                  <KanbanCard key={ticket.ticket_id} ticket={ticket} highlightText={searchTerm} />
                ))}
                {isEmpty && (
                  <div style={{ 
                    padding: '0.5rem', 
                    textAlign: 'center', 
                    color: 'var(--text-secondary)', 
                    fontSize: '0.75rem',
                    fontStyle: 'italic'
                  }}>
                    Keine Tickets
                  </div>
                )}
              </div>
            </SortableContext>
          )}
        </div>
      );
    });
  };

  return (
    <div ref={setNodeRef} style={columnStyle}>
      <div style={headerStyle}>
        <span style={{ flex: 1 }}></span>
        <span>{label}</span>
        <span
          style={{
            flex: 1,
            display: 'flex',
            justifyContent: 'flex-end'
          }}
        >
          <span
            style={{
              backgroundColor: 'rgba(255,255,255,0.3)',
              padding: '0.125rem 0.5rem',
              borderRadius: '1rem',
              fontSize: '0.75rem'
            }}
          >
            {tickets.length}
          </span>
        </span>
      </div>
      <div ref={setDropZoneRef} style={dropZoneStyle}>
        {isOverColumn && (
          <div style={{
            height: '100%',
            border: '2px dashed #3b82f6',
            borderRadius: '0.375rem',
            backgroundColor: 'rgba(59, 130, 246, 0.1)'
          }} />
        )}
      </div>
      <div style={contentStyle}>
        {renderGroupedContent()}
        {tickets.length === 0 && allGroups.length === 0 && (
          <div style={emptyStyle}>Keine Tickets</div>
        )}
      </div>
    </div>
  );
}

const emptyStyle = {
  padding: '2rem',
  textAlign: 'center',
  color: 'var(--text-secondary)',
  fontSize: '0.875rem'
};

const groupContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.25rem'
};

const groupHeaderStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.25rem',
  padding: '0.375rem 0.5rem',
  backgroundColor: 'var(--bg-secondary)',
  borderRadius: '0.375rem',
  border: '1px solid var(--border-color)'
};
