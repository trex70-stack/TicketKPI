import { getDbType } from './db.js';

export function getYearFilter() {
  if (getDbType() === 'oracle') {
    return "TO_CHAR(SYSDATE, 'YY')";
  }
  return "substr(strftime('%Y', 'now'), 3, 2)";
}

export function getYearFilterForColumn(dateColumn, protColumn = null) {
  const yearExpr = getYearFilter();
  
  if (protColumn) {
    if (getDbType() === 'oracle') {
      return `TO_CHAR(${protColumn}, 'YY') = ${yearExpr}`;
    }
    return `substr(${protColumn}, 7, 2) = ${yearExpr}`;
  }
  
  if (getDbType() === 'oracle') {
    return `TO_CHAR(${dateColumn}, 'YY') = ${yearExpr}`;
  }
  return `substr(${dateColumn}, 7, 2) = ${yearExpr}`;
}

export function getDateDiffMinutes(protZeitColumn, cdateColumn) {
  if (getDbType() === 'oracle') {
    return `
      AVG(
        TO_DATE('20' || TO_CHAR(${protZeitColumn}, 'YY') || '-' || TO_CHAR(${protZeitColumn}, 'MM') || '-' || TO_CHAR(${protZeitColumn}, 'DD'), 'YYYY-MM-DD')
        - TO_DATE('20' || TO_CHAR(${cdateColumn}, 'YY') || '-' || TO_CHAR(${cdateColumn}, 'MM') || '-' || TO_CHAR(${cdateColumn}, 'DD'), 'YYYY-MM-DD')
      ) * 24 * 60 as AVG_MINUTES
    `;
  }
  return `
    AVG(
      julianday('20' || substr(${protZeitColumn}, 7, 2) || '-' || substr(${protZeitColumn}, 4, 2) || '-' || substr(${protZeitColumn}, 1, 2))
      - julianday('20' || substr(${cdateColumn}, 7, 2) || '-' || substr(${cdateColumn}, 4, 2) || '-' || substr(${cdateColumn}, 1, 2))
    ) * 24 * 60 as avg_minutes
  `;
}

export function getSubstr(str, start, length) {
  if (getDbType() === 'oracle') {
    // For DATE columns, use TO_CHAR first
    return `TO_CHAR(${str}, 'YY')`;
  }
  return `substr(${str}, ${start}, ${length})`;
}

export function alias(name) {
  // Oracle returns uppercase column names by default
  // For SQLite we use lowercase
  if (getDbType() === 'oracle') {
    return name.toUpperCase();
  }
  return name;
}
