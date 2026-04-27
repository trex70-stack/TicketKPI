import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, User, Calendar, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import kpiLinksConfig from '../../config/kpiLinks.json';

const PRIORITY_COLORS = {
  'Kritisch': { bg: 'var(--bg-accent)', border: '#dc2626', text: '#dc2626' },
  'Hoch': { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' },
  'Mittel': { bg: '#e0f2fe', border: '#0ea5e9', text: '#0369a1' },
  'Niedrig': { bg: '#f0fdf4', border: '#22c55e', text: '#15803d' },
  'Unbekannt': { bg: 'var(--bg-tertiary)', border: 'var(--border-color)', text: 'var(--text-secondary)' }
};

const openedWindows = new Map();

export function KanbanCard({ ticket, isDragging, highlightText }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const highlightTextContent = (text, searchTerm) => {
    if (!text || !searchTerm || searchTerm.trim() === '') {
      return text;
    }
    
    const searchLower = searchTerm.toLowerCase().trim();
    const textStr = String(text);
    const textLower = textStr.toLowerCase();
    const parts = [];
    let lastIndex = 0;
    
    let index = textLower.indexOf(searchLower);
    while (index !== -1) {
      if (index > lastIndex) {
        parts.push(textStr.slice(lastIndex, index));
      }
      parts.push(
        <mark key={index} style={{ backgroundColor: '#fef08a', color: 'inherit', padding: 0 }}>
          {textStr.slice(index, index + searchLower.length)}
        </mark>
      );
      lastIndex = index + searchLower.length;
      index = textLower.indexOf(searchLower, lastIndex);
    }
    
    if (lastIndex < textStr.length) {
      parts.push(textStr.slice(lastIndex));
    }
    
    return parts.length > 0 ? parts : text;
  };

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition
  } = useSortable({ id: ticket.ticket_id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  const priorityStyle = PRIORITY_COLORS[ticket.priority_name] || PRIORITY_COLORS['Unbekannt'];

  const cardStyle = {
    backgroundColor: 'var(--bg-secondary)',
    borderRadius: '0.5rem',
    border: '1px solid var(--border-color)',
    padding: '0.75rem',
    cursor: 'grab',
    boxShadow: isDragging ? '0 4px 12px rgba(0,0,0,0.15)' : 'none',
    transition: 'box-shadow 0.2s, transform 0.2s',
    ...style
  };

  const formatCreatedDate = (dateStr) => {
    if (!dateStr) return '';
    if (dateStr.length === 8) {
      return `${dateStr.slice(0, 2)}.${dateStr.slice(2, 4)}.${dateStr.slice(6, 8)}`;
    }
    return dateStr;
  };

  const truncateText = (text, maxLength = 80) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const getTicketLink = (ticketId) => {
    const config = kpiLinksConfig.kanban?.ticketDetail;
    if (!config) return null;
    return config.link.replace('{ticketId}', ticketId);
  };

  const getBookEffortLink = (ticketId, title) => {
    const config = kpiLinksConfig.kanban?.bookEffort;
    if (!config) return null;
    return config.link
      .replace('{ticketId}', ticketId)
      .replace('{title}', encodeURIComponent(title));
  };

  const openTicket = (ticketId) => {
    const url = getTicketLink(ticketId);
    if (!url) return;
    
    const windowName = `ticket-${ticketId}`;
    const existing = openedWindows.get(windowName);
    
    if (existing && !existing.closed) {
      existing.focus();
      return;
    }
    
    const newWindow = window.open(url, windowName);
    openedWindows.set(windowName, newWindow);
  };

  const hasLongDescription = ticket.description && ticket.description.length > 80;
  const ticketLink = getTicketLink(ticket.ticket_id);
  const bookEffortLink = getBookEffortLink(ticket.ticket_id, ticket.title);

  return (
    <div ref={setNodeRef} style={cardStyle} {...attributes}>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
        <div
          {...listeners}
          style={{
            cursor: 'grab',
            color: 'var(--text-secondary)',
            padding: '0.25rem',
            marginTop: '-0.25rem'
          }}
        >
          <GripVertical size={14} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={headerRowStyle}>
            {ticketLink ? (
              <div
                style={ticketIdLinkStyle}
                onClick={(e) => {
                  e.stopPropagation();
                  openTicket(ticket.ticket_id);
                }}
                title="Ticket öffnen"
              >
                <span>#{highlightTextContent(ticket.ticket_id, highlightText)}</span>
                <ExternalLink size={10} style={{ marginLeft: '0.25rem', opacity: 0.7 }} />
              </div>
            ) : (
              <div style={ticketIdStyle}>#{highlightTextContent(ticket.ticket_id, highlightText)}</div>
            )}
            
            {bookEffortLink && (
              <a
                href={bookEffortLink}
                target="_blank"
                rel="noopener noreferrer"
                style={bookEffortButtonStyle}
                onClick={(e) => e.stopPropagation()}
                title="Aufwand buchen"
              >
                Aufwand buchen
              </a>
            )}
          </div>
          
          {ticketLink ? (
            <div
              style={ticketTitleLinkStyle}
              onClick={(e) => {
                e.stopPropagation();
                openTicket(ticket.ticket_id);
              }}
              title="Ticket öffnen"
            >
              {highlightTextContent(ticket.title, highlightText)}
            </div>
          ) : (
            <div style={ticketTitleStyle}>{highlightTextContent(ticket.title, highlightText)}</div>
          )}

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: '0.5rem' }}>
            <span
              style={{
                fontSize: '0.625rem',
                padding: '0.125rem 0.375rem',
                borderRadius: '0.25rem',
                backgroundColor: priorityStyle.bg,
                border: `1px solid ${priorityStyle.border}`,
                color: priorityStyle.text,
                fontWeight: 500
              }}
            >
              {highlightTextContent(ticket.priority_name, highlightText)}
            </span>
            <span
              style={{
                fontSize: '0.625rem',
                padding: '0.125rem 0.375rem',
                borderRadius: '0.25rem',
                backgroundColor: 'var(--bg-tertiary)',
                color: 'var(--text-secondary)'
              }}
            >
              {highlightTextContent(ticket.category_name, highlightText)}
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              fontSize: '0.75rem',
              color: 'var(--text-secondary)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <User size={12} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '80px' }}>
                {highlightTextContent(ticket.agent_name || 'Nicht zugewiesen', highlightText)}
              </span>
            </div>
            {ticket.created_at && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Calendar size={12} />
                <span>{highlightTextContent(formatCreatedDate(ticket.created_at), highlightText)}</span>
              </div>
            )}
          </div>

          {ticket.description && (
            <div style={descriptionContainerStyle}>
              <div style={descriptionLabelStyle}>Beschreibung:</div>
              <div style={descriptionTextStyle}>
                {highlightTextContent(isExpanded ? ticket.description : truncateText(ticket.description), highlightText)}
              </div>
              {hasLongDescription && (
                <button
                  style={toggleButtonStyle}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(!isExpanded);
                  }}
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp size={12} />
                      Weniger anzeigen
                    </>
                  ) : (
                    <>
                      <ChevronDown size={12} />
                      Mehr anzeigen
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const ticketIdStyle = {
  fontSize: '0.75rem',
  fontWeight: 600,
  color: 'var(--text-secondary)',
  fontFamily: 'monospace'
};

const headerRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '0.25rem',
  gap: '0.5rem'
};

const ticketIdLinkStyle = {
  fontSize: '0.75rem',
  fontWeight: 600,
  color: 'var(--accent-primary)',
  fontFamily: 'monospace',
  display: 'inline-flex',
  alignItems: 'center',
  cursor: 'pointer',
  transition: 'opacity 0.2s'
};

const bookEffortButtonStyle = {
  fontSize: '0.625rem',
  padding: '0.25rem 0.5rem',
  backgroundColor: 'var(--accent-primary)',
  color: 'white',
  border: 'none',
  borderRadius: '0.25rem',
  cursor: 'pointer',
  textDecoration: 'none',
  whiteSpace: 'nowrap',
  display: 'inline-block',
  lineHeight: 1.2,
  flexShrink: 0
};

const ticketTitleStyle = {
  fontSize: '0.875rem',
  fontWeight: 500,
  color: 'var(--text-primary)',
  marginBottom: '0.5rem',
  lineHeight: 1.3,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical'
};

const ticketTitleLinkStyle = {
  fontSize: '0.875rem',
  fontWeight: 500,
  color: 'var(--text-primary)',
  marginBottom: '0.5rem',
  lineHeight: 1.3,
  cursor: 'pointer',
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  transition: 'color 0.2s'
};

const descriptionContainerStyle = {
  marginTop: '0.5rem',
  paddingTop: '0.5rem',
  borderTop: '1px solid var(--border-color)'
};

const descriptionLabelStyle = {
  fontSize: '0.625rem',
  fontWeight: 500,
  color: 'var(--text-secondary)',
  marginBottom: '0.25rem'
};

const descriptionTextStyle = {
  fontSize: '0.75rem',
  color: 'var(--text-secondary)',
  lineHeight: 1.4,
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word'
};

const toggleButtonStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.25rem',
  fontSize: '0.625rem',
  color: 'var(--accent-primary)',
  cursor: 'pointer',
  background: 'none',
  border: 'none',
  padding: '0.25rem 0 0 0',
  marginTop: '0.25rem'
};
