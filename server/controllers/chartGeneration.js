const { ChartJSNodeCanvas } = require('chartjs-node-canvas');

const width = 500;
const height = 280;
const backgroundColour = 'white';
const canvasRenderService = new ChartJSNodeCanvas({ width, height, backgroundColour });

// Helper function to generate a bar chart for alert statistics
async function generateAlertBarChart(alertStats) {
  const configuration = {
    type: 'bar',
    data: {
      labels: ['Total', 'Active', 'Resolved'],
      datasets: [{
        label: 'Alert Statistics',
        data: [alertStats.total, alertStats.active, alertStats.resolved],
        backgroundColor: ['#3b82f6', '#10b981', '#ef4444'],
        borderColor: ['#2563eb', '#059669', '#dc2626'],
        borderWidth: 1
      }]
    },
    options: {
      plugins: {
        title: {
          display: true,
          text: 'Alert Statistics',
          font: { size: 16 }
        },
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: 'Count' }
        },
        x: {
          title: { display: true, text: 'Alert Types' }
        }
      }
    }
  };
  return await canvasRenderService.renderToBuffer(configuration);
}

// Helper function to generate a line chart for intervention statistics
async function generateInterventionLineChart(interventionStats) {
  const configuration = {
    type: 'line',
    data: {
      labels: ['Total Interventions', 'Average Duration'],
      datasets: [{
        label: 'Intervention Statistics',
        data: [interventionStats.total, interventionStats.averageDuration],
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.2)',
        fill: true,
        tension: 0.4
      }]
    },
    options: {
      plugins: {
        title: {
          display: true,
          text: 'Intervention Statistics',
          font: { size: 16 }
        },
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: 'Value' }
        },
        x: {
          title: { display: true, text: 'Metrics' }
        }
      }
    }
  };
  return await canvasRenderService.renderToBuffer(configuration);
}

// Helper function to generate a pie chart for maintenance statistics
async function generateMaintenancePieChart(maintenanceStats) {
  const types = maintenanceStats.byType || {};
  const labels = Object.keys(types);
  const data = Object.values(types);

  const configuration = {
    type: 'pie',
    data: {
      labels: labels.length ? labels : ['No Data'],
      datasets: [{
        label: 'Maintenance Types',
        data: data.length ? data : [1],
        backgroundColor: data.length
          ? ['#f97316', '#facc15', '#22d3ee', '#a3e635']
          : ['#d1d5db'],
        borderColor: '#ffffff',
        borderWidth: 1
      }]
    },
    options: {
      plugins: {
        title: {
          display: true,
          text: 'Maintenance Statistics by Type',
          font: { size: 16 }
        },
        legend: { position: 'right' }
      }
    }
  };
  return await canvasRenderService.renderToBuffer(configuration);
}

// Main function to generate all charts
async function generateStatsCharts({ alertStats, interventionStats, maintenanceStats }) {
  const alertBarChart = await generateAlertBarChart(alertStats);
  const interventionLineChart = await generateInterventionLineChart(interventionStats);
  const maintenancePieChart = await generateMaintenancePieChart(maintenanceStats);

  return { alertBarChart, interventionLineChart, maintenancePieChart };
}

module.exports = { generateStatsCharts };
