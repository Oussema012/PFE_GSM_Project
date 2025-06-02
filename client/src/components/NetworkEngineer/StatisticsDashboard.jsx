import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bar, Line, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js';

// Register Chart.js components, including Filler
ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler);

const API_BASE_URL = 'http://localhost:8000';

const StatisticsDashboard = () => {
  const [sites, setSites] = useState([]);
  const [reports, setReports] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSitesAndReports = async () => {
      setLoading(true);
      setError('');
      try {
        // Fetch all sites
        const sitesResponse = await axios.get(`${API_BASE_URL}/api/sites`);
        console.log('Sites response:', sitesResponse.data); // Debug log
        if (sitesResponse.data.length === 0) {
          setError('No sites found.');
          setLoading(false);
          return;
        }
        setSites(sitesResponse.data);

        // Fetch data for each site
        const reportPromises = sitesResponse.data.map(async (site) => {
          const siteId = site._id; // Use _id from Site model
          console.log(`Fetching data for site: ${site.name} (ID: ${siteId})`); // Debug log
          try {
            // Fetch active alerts
            const activeAlertsResponse = await axios.get(`${API_BASE_URL}/api/alerts/active/${siteId}`);
            const activeAlerts = activeAlertsResponse.data;
            console.log(`Active alerts for ${site.name}:`, activeAlerts.length); // Debug log

            // Fetch resolved alerts
            const resolvedAlertsResponse = await axios.get(`${API_BASE_URL}/api/alerts/resolved/${siteId}`);
            const resolvedAlerts = resolvedAlertsResponse.data;
            console.log(`Resolved alerts for ${site.name}:`, resolvedAlerts.length); // Debug log

            // Fetch interventions (try site-specific endpoint first)
            let interventions = [];
            try {
              const interventionsResponse = await axios.get(`${API_BASE_URL}/api/interventions/site/${siteId}`);
              interventions = interventionsResponse.data.data || [];
              console.log(`Interventions for ${site.name} (site endpoint):`, interventions.length); // Debug log
            } catch (siteIntErr) {
              console.warn(`Site-specific interventions endpoint failed for ${site.name}:`, siteIntErr.message); // Debug log
              // Fallback to fetching all interventions and filtering
              const allInterventionsResponse = await axios.get(`${API_BASE_URL}/api/interventions/all`);
              interventions = allInterventionsResponse.data.data.filter(int => int.siteId === siteId || int.siteId === site.site_reference) || [];
              console.log(`Interventions for ${site.name} (all endpoint, filtered):`, interventions.length); // Debug log
            }

            // Fetch equipment for the site
            const equipmentResponse = await axios.get(`${API_BASE_URL}/api/equipment/${siteId}`);
            const equipment = equipmentResponse.data;
            console.log(`Equipment for ${site.name}:`, equipment.length); // Debug log

            // Fetch maintenance records for all equipment at the site
            const maintenancePromises = equipment.map(eq =>
              axios.get(`${API_BASE_URL}/api/maintenance/equipment/${eq._id}`)
            );
            const maintenanceResponses = await Promise.all(maintenancePromises);
            const maintenanceRecords = maintenanceResponses.flatMap(res => res.data.data || []);
            console.log(`Maintenance records for ${site.name}:`, maintenanceRecords.length); // Debug log

            // Process alert statistics
            const alertStats = {
              total: activeAlerts.length + resolvedAlerts.length,
              active: activeAlerts.length,
              resolved: resolvedAlerts.length
            };

            // Process intervention statistics
            const totalInterventions = interventions.length;
            const completedInterventions = interventions.filter(int => int.status === 'completed' && int.resolvedAt && int.createdAt);
            const averageDuration = completedInterventions.length > 0
              ? completedInterventions.reduce((sum, int) => {
                  const duration = (new Date(int.resolvedAt) - new Date(int.createdAt)) / (1000 * 60); // Duration in minutes
                  return sum + duration;
                }, 0) / completedInterventions.length
              : 0;

            const interventionStats = {
              total: totalInterventions,
              averageDuration: Number(averageDuration.toFixed(2))
            };

            // Process maintenance statistics
            const maintenanceByType = maintenanceRecords.reduce((acc, record) => {
              const type = record.description.split(' ')[0] || 'Other'; // Derive type from description
              acc[type] = (acc[type] || 0) + 1;
              return acc;
            }, {});

            const maintenanceStats = {
              total: maintenanceRecords.length,
              completed: maintenanceRecords.filter(record => record.status === 'completed').length,
              scheduled: maintenanceRecords.filter(record => record.status === 'pending').length,
              byType: maintenanceByType
            };

            return {
              siteId,
              report: {
                generatedAt: new Date().toISOString(), // Current time in CET
                data: {
                  alertStats,
                  interventionStats,
                  maintenanceStats
                }
              }
            };
          } catch (err) {
            console.error(`Error fetching data for site ${site.name} (ID: ${siteId}):`, err);
            return { siteId, report: null };
          }
        });

        const reportsData = {};
        const results = await Promise.all(reportPromises);
        results.forEach(({ siteId, report }) => {
          reportsData[siteId] = report;
        });

        if (Object.values(reportsData).every(report => report === null)) {
          setError('No reports found for any site.');
        }

        setReports(reportsData);
      } catch (err) {
        setError('Failed to fetch data: ' + (err.response?.data?.message || err.message));
      } finally {
        setLoading(false);
      }
    };

    fetchSitesAndReports();
  }, []);

  const getChartData = (siteId, type) => {
    const report = reports[siteId];
    if (!report) return null;

    switch (type) {
      case 'alert':
        return {
          labels: ['Total', 'Active', 'Resolved'],
          datasets: [{
            label: `Alert Statistics (${siteId})`,
            data: [
              report.data.alertStats.total || 0,
              report.data.alertStats.active || 0,
              report.data.alertStats.resolved || 0
            ],
            backgroundColor: ['#3b82f6', '#10b981', '#ef4444'],
            borderColor: ['#2563eb', '#059669', '#dc2626'],
            borderWidth: 1
          }]
        };
      case 'intervention':
        return {
          labels: ['Total Interventions', 'Average Duration (min)'],
          datasets: [{
            label: `Intervention Statistics (${siteId})`,
            data: [
              report.data.interventionStats.total || 0,
              report.data.interventionStats.averageDuration || 0
            ],
            borderColor: '#8b5cf6',
            backgroundColor: 'rgba(139, 92, 246, 0.2)',
            fill: true,
            tension: 0.4
          }]
        };
      case 'maintenance':
        return {
          labels: Object.keys(report.data.maintenanceStats.byType || {}),
          datasets: [{
            label: `Maintenance Types (${siteId})`,
            data: Object.values(report.data.maintenanceStats.byType || {}),
            backgroundColor: ['#f97316', '#facc15', '#22d3ee', '#a3e635'],
            borderColor: '#ffffff',
            borderWidth: 1
          }]
        };
      default:
        return null;
    }
  };

  const chartOptions = {
    plugins: {
      title: { display: true, font: { size: 16 } },
      legend: { position: 'right' }
    },
    scales: {
      y: { beginAtZero: true },
      x: { display: true }
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Statistics Dashboard</h1>

      {loading && (
        <div className="flex justify-center items-center">
          <svg className="animate-spin h-8 w-8 text-teal-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z" />
          </svg>
        </div>
      )}
      {error && <p className="text-red-600 font-medium text-center">{error}</p>}

      {!loading && !error && sites.length > 0 && (
        <div className="space-y-12">
          {sites.map(site => {
            const siteId = site._id;
            const report = reports[siteId];
            return (
              <div key={siteId}>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">{site.name} Statistics</h2>
                {report ? (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="bg-gray-50 p-4 rounded-lg shadow">
                      <h3 className="text-lg font-semibold text-gray-700 mb-4">Alert Statistics</h3>
                      <p className="text-gray-600 mb-2">Total Alerts: {report.data.alertStats.total}</p>
                      <p className="text-gray-600 mb-2">Active Alerts: {report.data.alertStats.active}</p>
                      <p className="text-gray-600 mb-4">Resolved Alerts: {report.data.alertStats.resolved}</p>
                      <Bar
                        data={getChartData(siteId, 'alert')}
                        options={{ ...chartOptions, plugins: { ...chartOptions.plugins, title: { ...chartOptions.plugins.title, text: `Alert Statistics (${site.name})` } } }}
                      />
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg shadow">
                      <h3 className="text-lg font-semibold text-gray-700 mb-3">Intervention Statistics</h3>
                      <p className="text-gray-600 mb-2">Total Interventions: {report.data.interventionStats.total}</p>
                      <p className="text-gray-600 mb-4">
                        Average Duration:{' '}
                        {report.data.interventionStats.averageDuration > 0
                          ? `${report.data.interventionStats.averageDuration.toFixed(2)} minutes`
                          : 'N/A (No completed interventions)'}
                      </p>
                      <Line
                        data={getChartData(siteId, 'intervention')}
                        options={{ ...chartOptions, plugins: { ...chartOptions.plugins, title: { ...chartOptions.plugins.title, text: `Intervention Statistics (${site.name})` } } }}
                      />
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg shadow">
                      <h3 className="text-lg font-semibold text-gray-700 mb-3">Maintenance Statistics</h3>
                      <p className="text-gray-600 mb-2">Total Maintenance: {report.data.maintenanceStats.total}</p>
                      <p className="text-gray-600 mb-2">Completed: {report.data.maintenanceStats.completed}</p>
                      <p className="text-gray-600 mb-4">Scheduled: {report.data.maintenanceStats.scheduled}</p>
                      <Pie
                        data={getChartData(siteId, 'maintenance')}
                        options={{ ...chartOptions, plugins: { ...chartOptions.plugins, title: { ...chartOptions.plugins.title, text: `Maintenance Statistics by Type (${site.name})` } } }}
                      />
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-600">No report available for {site.name}.</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StatisticsDashboard;