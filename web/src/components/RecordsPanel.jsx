import { formatDate, formatRecord } from '../lib/format.js';

// The white box of personal records, one pink row per exercise.
// Shows nothing at all until the user has at least one record.
export default function RecordsPanel({ records }) {
  if (records.length === 0) return null;

  return (
    <aside className="records-panel panel" aria-labelledby="records-heading">
      <h2 id="records-heading" className="records-heading">Personal records</h2>
      <ul className="records">
        {records.map((record) => (
          <li className="record" key={record.exercise}>
            <span className="record-exercise">{record.exercise}</span>
            <strong className="record-value">{formatRecord(record)}</strong>
            <span className="record-date">
              {formatDate(record.date, { day: 'numeric', month: 'short' })}
            </span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
