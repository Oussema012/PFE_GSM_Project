// exportCSV.js

// Escapes special characters in CSV values to ensure proper formatting
const escapeCsvValue = (value) => {
  if (value === null || value === undefined || value === '') return 'N/A';
  const str = String(value).trim();
  // Wrap in quotes if the string contains commas, quotes, or newlines
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`; // Escape inner quotes
  }
  return str;
};

// Formats a date to DD/MM/YYYY or returns 'N/A' if invalid
const formatDate = (value) => {
  if (!value) return 'N/A';
  try {
    const date = new Date(value);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('en-GB'); // e.g., "26/05/2025"
  } catch {
    return 'N/A';
  }
};

// Generates and downloads a CSV file based on intervention data
const downloadCSV = (data) => {
  // Headers matching the table columns in NetworkTopology.jsx
  const headers = ['Site ID', 'Technician', 'Planned Date', 'Priority', 'Status'];

  // Map data to CSV rows, aligning with table columns
  const rows = data.map((item) => [
    escapeCsvValue(item.siteId),
    escapeCsvValue(item.technician?.name), // Use technician.name instead of the object
    escapeCsvValue(formatDate(item.plannedDate)),
    escapeCsvValue(item.priority),
    escapeCsvValue(item.status),
  ]);

  // Combine headers and rows into CSV content
  const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\r\n');

  // Create and trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `interventions_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href); // Clean up URL object
};

export default downloadCSV;