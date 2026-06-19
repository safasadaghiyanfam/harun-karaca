export function Table({ columns, rows }: { columns: string[]; rows: Array<Record<string, React.ReactNode>> }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td className="empty-cell" colSpan={columns.length}>Gosterilecek kayit yok</td>
            </tr>
          ) : rows.map((row, index) => (
            <tr key={index}>
              {columns.map((column) => <td key={column}><span className="cell-content">{row[column]}</span></td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
