import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { KanbanColumn } from '../components/kanban/KanbanColumn';
import { KanbanFilters } from '../components/kanban/KanbanFilters';
import { KanbanCard } from '../components/kanban/KanbanCard';
import { fetchKanbanTickets, fetchStatusLabels } from '../services/api';
import kpiLinks from '../config/kpiLinks.json';
import { AlertCircle, X, Loader2 } from 'lucide-react';

const STATUS_ORDER = ['0', '80', '200'];
const DEFAULT_STATUS_LABELS = {
  '0': 'Neu',
  // '20': 'Warte auf Rückfrage', // TODO: Später aktivieren wenn in DB verwendet
  '80': 'In Bearbeitung',
  // '150': 'In Prüfung', // TODO: Später aktivieren wenn in DB verwendet
  '200': 'Geschlossen'
};

const LOCAL_STORAGE_KEY = 'kanban_collapsed_groups';

export default function KanbanBoard({ filters, preselectedAgent }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFilters, setSelectedFilters] = useState(() => ({
    category: searchParams.get('category') || 'all',
    priority: searchParams.get('priority') || 'all',
    agent: searchParams.get('agent') || preselectedAgent || 'all'
  }));
  const [grouping, setGrouping] = useState(() => searchParams.get('grouping') || 'category');
  const [activeId, setActiveId] = useState(null);
  const [notification, setNotification] = useState(null);
  const [collapsedGroups, setCollapsedGroups] = useState(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get('search') || '');
  const [statusLabels, setStatusLabels] = useState(DEFAULT_STATUS_LABELS);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  const loadTickets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchKanbanTickets(selectedFilters);
      setTickets(data.tickets || []);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }, [selectedFilters]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  useEffect(() => {
    async function loadLabels() {
      try {
        const data = await fetchStatusLabels();
        if (data.labels) {
          setStatusLabels(data.labels);
        }
      } catch (err) {
        console.error('Failed to load status labels:', err);
      }
    }
    loadLabels();
  }, []);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(collapsedGroups));
  }, [collapsedGroups]);

  const handleFilterChange = (key, value) => {
    setSelectedFilters(prev => ({ ...prev, [key]: value }));
    const newParams = new URLSearchParams(searchParams);
    newParams.set('view', 'kanban');
    newParams.set(key, value);
    setSearchParams(newParams, { replace: true });
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      category: 'all',
      priority: 'all',
      agent: preselectedAgent || 'all'
    };
    setSelectedFilters(clearedFilters);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('view', 'kanban');
    newParams.set('category', 'all');
    newParams.set('priority', 'all');
    newParams.set('agent', clearedFilters.agent);
    setSearchParams(newParams, { replace: true });
  };

  const handleGroupingChange = (newGrouping) => {
    setGrouping(newGrouping);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('view', 'kanban');
    newParams.set('grouping', newGrouping);
    setSearchParams(newParams, { replace: true });
  };

  const handleSearchChange = (term) => {
    setSearchTerm(term);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('view', 'kanban');
    if (term) {
      newParams.set('search', term);
    } else {
      newParams.delete('search');
    }
    setSearchParams(newParams, { replace: true });
  };

  const showNotification = (message, type = 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const findTicket = (id) => {
    return tickets.find(t => t.ticket_id === id);
  };

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const ticketId = active.id;
    let newStatus = over.id;
    
    // Drop-Zone ID erkennen (z.B. "dropzone-80" -> "80")
    if (typeof newStatus === 'string' && newStatus.startsWith('dropzone-')) {
      newStatus = newStatus.replace('dropzone-', '');
    }

    const ticket = findTicket(ticketId);
    if (!ticket) return;

    if (ticket.status === newStatus) return;

    const changeStatusLink = kpiLinks.kanban?.changeStatus?.link;
    if (!changeStatusLink) {
      showNotification('Kein Status-Änderungs-Link konfiguriert', 'error');
      return;
    }

    const statusText = statusLabels[newStatus];
    const url = changeStatusLink
      .replace('{ticketId}', ticketId)
      .replace('{status}', statusText);

    window.open(url, '_blank');
  };

  const getGroupKey = (ticket) => {
    switch (grouping) {
      case 'category':
        return ticket.type_id || 'unknown';
      case 'priority':
        return ticket.priority_id || 'unknown';
      case 'agent':
        return (ticket.agent && ticket.agent_name && ticket.agent_name !== 'Nicht zugewiesen') 
          ? ticket.agent 
          : 'unassigned';
      default:
        return 'all';
    }
  };

  const getGroupLabel = (ticket) => {
    switch (grouping) {
      case 'category':
        return ticket.category_name || 'Unbekannt';
      case 'priority':
        return ticket.priority_name || 'Unbekannt';
      case 'agent':
        return ticket.agent_name || 'Nicht zugewiesen';
      default:
        return 'Alle';
    }
  };

  const getAllGroups = useCallback(() => {
    if (grouping === 'none') {
      return [{ key: 'all', label: 'Alle' }];
    }

    const groupMap = new Map();
    tickets.forEach(ticket => {
      const key = getGroupKey(ticket);
      const label = getGroupLabel(ticket);
      if (!groupMap.has(key)) {
        groupMap.set(key, label);
      }
    });

    const groups = Array.from(groupMap.entries())
      .map(([key, label]) => ({ key, label }))
      .sort((a, b) => a.label.localeCompare(b.label, 'de'));

    return groups;
  }, [tickets, grouping]);

  const getTicketsByStatus = (status) => {
    return tickets.filter(t => t.status === status);
  };

  const matchesSearch = (ticket, term) => {
    if (!term || term.trim() === '') return true;
    const searchLower = term.toLowerCase().trim();
    const searchableFields = [
      ticket.ticket_id,
      ticket.title,
      ticket.description,
      ticket.priority_name,
      ticket.category_name,
      ticket.agent_name,
      ticket.created_at
    ];
    return searchableFields.some(field => 
      field && String(field).toLowerCase().includes(searchLower)
    );
  };

  const getFilteredTicketsByStatus = (status) => {
    return getTicketsByStatus(status).filter(t => matchesSearch(t, searchTerm));
  };

  const getCollapsedKey = (groupKey) => {
    return `${grouping}_${groupKey}`;
  };

  const isGroupCollapsed = (groupKey) => {
    const key = getCollapsedKey(groupKey);
    return collapsedGroups[key] === true;
  };

  const toggleGroup = (groupKey) => {
    const key = getCollapsedKey(groupKey);
    setCollapsedGroups(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const areAllCollapsed = () => {
    const allGroups = getAllGroups();
    if (allGroups.length === 0) return false;
    
    return allGroups.every(group => isGroupCollapsed(group.key));
  };

  const toggleAllGroups = () => {
    const allGroups = getAllGroups();
    const allAreCollapsed = areAllCollapsed();
    
    const newCollapsed = { ...collapsedGroups };
    
    allGroups.forEach(group => {
      const key = getCollapsedKey(group.key);
      newCollapsed[key] = !allAreCollapsed;
    });
    
    setCollapsedGroups(newCollapsed);
  };

  const activeTicket = activeId ? findTicket(activeId) : null;
  const allGroups = getAllGroups();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px' }}>
        <Loader2 size={32} className="spin" style={{ color: 'var(--accent-primary)' }} />
        <span style={{ marginLeft: '0.75rem', color: 'var(--text-secondary)' }}>Tickets werden geladen...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          padding: '2rem',
          textAlign: 'center',
          color: '#dc2626',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '0.5rem'
        }}
      >
        <AlertCircle size={32} style={{ marginBottom: '0.5rem' }} />
        <div>Fehler beim Laden: {error}</div>
      </div>
    );
  }

  return (
    <div style={{ height: '100%' }}>
      <KanbanFilters
        filters={filters}
        selectedFilters={selectedFilters}
        onFilterChange={handleFilterChange}
        onClear={handleClearFilters}
        grouping={grouping}
        onGroupingChange={handleGroupingChange}
        allCollapsed={areAllCollapsed()}
        onToggleAll={toggleAllGroups}
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
      />

      {notification && (
        <div
          style={{
            position: 'fixed',
            top: '1rem',
            right: '1rem',
            padding: '0.75rem 1rem',
            borderRadius: '0.5rem',
            backgroundColor: notification.type === 'success' ? '#dcfce7' : '#fef2f2',
            border: `1px solid ${notification.type === 'success' ? '#22c55e' : '#ef4444'}`,
            color: notification.type === 'success' ? '#15803d' : '#dc2626',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            zIndex: 1000,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}
        >
          {notification.type === 'error' && <AlertCircle size={16} />}
          <span>{notification.message}</span>
          <button
            onClick={() => setNotification(null)}
            style={{ marginLeft: '0.5rem', cursor: 'pointer', background: 'none', border: 'none' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div
          style={{
            display: 'flex',
            gap: '1rem',
            overflowX: 'auto',
            paddingBottom: '1rem'
          }}
        >
          {STATUS_ORDER.map(status => (
            <KanbanColumn
              key={status}
              status={status}
              label={statusLabels[status]}
              tickets={getFilteredTicketsByStatus(status)}
              groupBy={grouping}
              allGroups={allGroups}
              collapsedGroups={collapsedGroups}
              onToggleGroup={toggleGroup}
              isGroupCollapsed={isGroupCollapsed}
              searchTerm={searchTerm}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTicket ? <KanbanCard ticket={activeTicket} isDragging /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
