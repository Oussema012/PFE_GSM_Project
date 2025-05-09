import React, { useState } from 'react';
import axios from 'axios';

// Configure the backend API base URL
const API_BASE_URL = 'http://localhost:3000'; // Update to match your backend server URL

const DashReport = () => {
  const [reports, setReports] = useState([]);
  const [siteId, setSiteId] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [reportType, setReportType] = useState('summary');
  const [selectedReport, setSelectedReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchReports = async () => {
    if (!siteId) {
      setError('Site ID is required.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      let url = `${API_BASE_URL}/api/reports/${siteId}`;
      if (fromDate && toDate) {
        url = `${API_BASE_URL}/api/reports/date-range/${siteId}?fromDate=${fromDate}&toDate=${toDate}`;
      }
      const response = await axios.get(url);
      setReports(response.data);
    } catch (err) {
      setError('Failed to fetch reports: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    if (!siteId || !fromDate || !toDate) {
      setError('Please fill in all required fields.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await axios.post(`${API_BASE_URL}/api/reports/generate`, {
        siteId,
        fromDate,
        toDate,
        reportType,
        generatedBy: 'user',
      });
      fetchReports();
      alert('Report generated successfully!');
    } catch (err) {
      setError('Failed to generate report: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const deleteReport = async (id) => {
    if (!window.confirm('Are you sure you want to delete this report?')) return;
    setLoading(true);
    setError('');
    try {
      await axios.delete(`${API_BASE_URL}/api/reports/${id}`);
      fetchReports();
      if (selectedReport?._id === id) setSelectedReport(null);
      alert('Report deleted successfully!');
    } catch (err) {
      setError('Failed to delete report: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const viewReport = async (id) => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`${API_BASE_URL}/api/reports/report/${id}`);
      setSelectedReport(response.data);
    } catch (err) {
      setError('Failed to fetch report details: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 p-6 font-sans">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-extrabold text-gray-800 mb-8 text-center">Report Dashboard</h1>

        {/* Filters and Generate Report */}
        <div className="bg-white p-6 rounded-xl shadow-lg mb-8">
          <h2 className="text-2xl font-semibold text-gray-700 mb-6">Generate New Report</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="Site ID"
              value={siteId}
              onChange={(e) => setSiteId(e.target.value)}
              className="p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            >
              <option value="summary">Summary</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <div className="mt-6 flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0">
            <button
              onClick={generateReport}
              disabled={loading}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300 transition flex items-center justify-center"
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5 mr-2 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z" />
                </svg>
              ) : null}
              {loading ? 'Generating...' : 'Generate Report'}
            </button>
            <button
              onClick={fetchReports}
              disabled={loading || !siteId}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-300 transition"
            >
              {loading ? 'Loading...' : 'Fetch Reports'}
            </button>
          </div>
          {error && <p className="mt-4 text-red-600 font-medium">{error}</p>}
        </div>

        {/* Report List */}
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-2xl font-semibold text-gray-700 mb-6">Reports</h2>
          {loading && (
            <div className="flex justify-center items-center">
              <svg className="animate-spin h-8 w-8 text-indigo-600" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z" />
              </svg>
            </div>
          )}
          {!loading && reports.length === 0 && <p className="text-gray-600 text-center">No reports found.</p>}
          {!loading && reports.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-separate border-spacing-y-2">
                <thead>
                  <tr className="bg-indigo-100 text-indigo-800">
                    <th className="p-4 rounded-l-lg">Report ID</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">Date Range</th>
                    <th className="p-4">Generated By</th>
                    <th className="p-4 rounded-r-lg">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report) => (
                    <tr key={report._id} className="bg-gray-50 hover:bg-indigo-50 transition rounded-lg">
                      <td className="p-4 rounded-l-lg">{report._id}</td>
                      <td className="p-4 capitalize">{report.reportType}</td>
                      <td className="p-4">
                        {new Date(report.fromDate).toLocaleDateString()} -{' '}
                        {new Date(report.toDate).toLocaleDateString()}
                      </td>
                      <td className="p-4">{report.generatedBy}</td>
                      <td className="p-4 rounded-r-lg">
                        <button
                          onClick={() => viewReport(report._id)}
                          className="text-indigo-600 hover:text-indigo-800 font-medium mr-4"
                        >
                          View
                        </button>
                        <button
                          onClick={() => deleteReport(report._id)}
                          className="text-red-600 hover:text-red-800 font-medium"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Report Details Modal */}
        {selectedReport && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <h2 className="text-3xl font-bold text-gray-800 mb-6">Report Details</h2>
              <div className="space-y-4 text-gray-700">
                <p><strong className="font-semibold">ID:</strong> {selectedReport._id}</p>
                <p><strong className="font-semibold">Site ID:</strong> {selectedReport.siteId}</p>
                <p><strong className="font-semibold">Type:</strong> {selectedReport.reportType}</p>
                <p>
                  <strong className="font-semibold">Date Range:</strong>{' '}
                  {new Date(selectedReport.fromDate).toLocaleDateString()} -{' '}
                  {new Date(selectedReport.toDate).toLocaleDateString()}
                </p>
                <p><strong className="font-semibold">Generated By:</strong> {selectedReport.generatedBy}</p>
                <p>
                  <strong className="font-semibold">Generated At:</strong>{' '}
                  {new Date(selectedReport.generatedAt).toLocaleString()}
                </p>
                <h3 className="text-xl font-semibold mt-6 text-indigo-700">Alert Statistics</h3>
                <p><strong className="font-semibold">Total Alerts:</strong> {selectedReport.data.alertStats.total}</p>
                <p><strong className="font-semibold">Active Alerts:</strong> {selectedReport.data.alertStats.active}</p>
                <p><strong className="font-semibold">Resolved Alerts:</strong> {selectedReport.data.alertStats.resolved}</p>
                <h3 className="text-xl font-semibold mt-6 text-indigo-700">Intervention Statistics</h3>
                <p><strong className="font-semibold">Total Interventions:</strong> {selectedReport.data.interventionStats.total}</p>
                <p>
                  <strong className="font-semibold">Average Duration:</strong>{' '}
                  {selectedReport.data.interventionStats.averageDuration || 'N/A'}
                </p>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="mt-6 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashReport;