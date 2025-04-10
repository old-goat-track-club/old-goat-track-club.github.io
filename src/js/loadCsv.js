export async function loadCsv(filePath) {
  try {
    const response = await fetch(filePath);
    const csvText = await response.text();
    const rows = csvText.split('\n').map(row => row.split(','));
    const headers = rows[0];
    const data = rows.slice(1);
    return { headers, data };
  } catch (error) {
    console.error('Error loading CSV:', error);
    return { headers: [], data: [] };
  }
}

export function createTable(tableId, headers, data) {
  const table = document.getElementById(tableId);
  if (!table) return;

  // Create header
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  headers.forEach(header => {
    if (header !== 'URL') { // Don't show URL column in header
      const th = document.createElement('th');
      th.textContent = header;
      headerRow.appendChild(th);
    }
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  // Create body
  const tbody = document.createElement('tbody');
  data.forEach(row => {
    if (row.length > 1) { // Skip empty rows
      const tr = document.createElement('tr');
      row.forEach((cell, index) => {
        if (headers[index] !== 'URL') { // Don't create cell for URL column
          const td = document.createElement('td');
          if (headers[index] === 'Event' && row[headers.indexOf('URL')]) {
            // Create clickable link for event name
            const link = document.createElement('a');
            link.href = row[headers.indexOf('URL')];
            link.textContent = cell;
            link.target = '_blank'; // Open in new tab
            link.rel = 'noopener noreferrer'; // Security best practice
            td.appendChild(link);
          } else {
            td.textContent = cell;
          }
          tr.appendChild(td);
        }
      });
      tbody.appendChild(tr);
    }
  });
  table.appendChild(tbody);
}

export function createRosterTable(tableId, headers, data) {
  const table = document.getElementById(tableId);
  if (!table) return;

  // Create header
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  headers.forEach(header => {
    const th = document.createElement('th');
    th.textContent = header;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  // Create body
  const tbody = document.createElement('tbody');
  data.forEach(row => {
    if (row.length > 1) { // Skip empty rows
      const tr = document.createElement('tr');
      row.forEach(cell => {
        const td = document.createElement('td');
        td.textContent = cell;
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    }
  });
  table.appendChild(tbody);
}

export function createRecordsTable(tableId, headers, data) {
  const table = document.getElementById(tableId);
  if (!table) return;

  // Create header
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  ['Men\'s Record', 'Event', 'Women\'s Record'].forEach(header => {
    const th = document.createElement('th');
    th.textContent = header;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  // Create body
  const tbody = document.createElement('tbody');
  data.forEach(row => {
    if (row.length > 1) { // Skip empty rows
      const tr = document.createElement('tr');
      
      // Men's record cell
      const tdMen = document.createElement('td');
      tdMen.innerHTML = `
        <div class="record-holder">${row[1]}</div>
        <span class="record-time">${row[2]}</span>
        <span class="record-date">${row[3]}</span>
      `;
      
      // Event name cell
      const tdEvent = document.createElement('td');
      tdEvent.className = 'event-name';
      tdEvent.textContent = row[0];
      
      // Women's record cell
      const tdWomen = document.createElement('td');
      tdWomen.innerHTML = `
        <div class="record-holder">${row[4]}</div>
        <span class="record-time">${row[5]}</span>
        <span class="record-date">${row[6]}</span>
      `;
      
      tr.appendChild(tdMen);
      tr.appendChild(tdEvent);
      tr.appendChild(tdWomen);
      tbody.appendChild(tr);
    }
  });
  table.appendChild(tbody);
}
