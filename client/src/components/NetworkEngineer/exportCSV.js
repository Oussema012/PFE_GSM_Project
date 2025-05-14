// exportCSV.js

const escapeCsvValue = (value) => {
  if (value === null || value === undefined || value === '') return 'N/A';
  const str = String(value).trim();
  // Wrap in quotes if contains special characters
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`; // escape inner quotes
  }
  return str;
};

const formatDate = (value) => {
  if (!value) return 'N/A';
  try {
    const date = new Date(value);
    return date.toLocaleDateString('en-GB'); // "DD/MM/YYYY"
  } catch {
    return 'N/A';
  }
};

const downloadCSV = (data) => {
  const headers = [
    'Site ID',
    'Description',
    'Status',
    'Priority',
    'Technician',
    'Team',
    'Planned Date',
    'Start Time',
    'End Time',
    'Date Created',
    'Resolution Notes',
    'Resolved At',
    'Validated By',
  ];

  const rows = data.map((item) => [
    escapeCsvValue(item.siteId),
    escapeCsvValue(item.description),
    escapeCsvValue(item.status),
    escapeCsvValue(item.priority),
    escapeCsvValue(item.technician),
    escapeCsvValue(Array.isArray(item.team) && item.team.length ? item.team.join('; ') : 'None'),
    escapeCsvValue(formatDate(item.plannedDate)),
    escapeCsvValue(item.timeSlot?.start || 'N/A'),
    escapeCsvValue(item.timeSlot?.end || 'N/A'),
    escapeCsvValue(formatDate(item.createdAt)),
    escapeCsvValue(item.resolutionNotes),
    escapeCsvValue(formatDate(item.resolvedAt)),
    escapeCsvValue(item.validatedBy),
  ]);

  const csvLines = [
    headers.join(','),         // first row: headers
    ...rows.map((row) => row.join(',')), // next rows: data
  ];

  const csvContent = csvLines.join('\r\n'); // ensure each row is a new line

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', `interventions_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export default downloadCSV;
