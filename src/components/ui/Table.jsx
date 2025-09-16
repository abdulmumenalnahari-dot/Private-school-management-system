// src/components/ui/Table.jsx
import React from 'react';

const Table = ({ columns, data, renderActions, emptyMessage = "لا توجد بيانات" }) => {
  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            {columns.map(column => (
              <th key={column.accessor}>{column.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="no-data">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map(item => (
              <tr key={item.id}>
                {columns.map(column => (
                  <td key={column.accessor}>
                    {column.accessor === 'actions' 
                      ? renderActions(item) 
                      : column.render 
                        ? column.render(item)
                        : item[column.accessor]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Table;