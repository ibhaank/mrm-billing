import React, { useState, useMemo } from 'react';
import { useApp } from '../contexts/AppContext';

// Helper to format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount || 0);
};

// Get client initials for avatar
const getClientInitials = (name) => {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

// Month labels
const MONTH_OPTIONS = [
  { key: 'apr', label: 'April' },
  { key: 'may', label: 'May' },
  { key: 'jun', label: 'June' },
  { key: 'jul', label: 'July' },
  { key: 'aug', label: 'August' },
  { key: 'sep', label: 'September' },
  { key: 'oct', label: 'October' },
  { key: 'nov', label: 'November' },
  { key: 'dec', label: 'December' },
  { key: 'jan', label: 'January' },
  { key: 'feb', label: 'February' },
  { key: 'mar', label: 'March' },
];

function ReportsPanel({ onClose }) {
  const { clients, billingEntries, settings } = useApp();
  const [activeReport, setActiveReport] = useState('dashboard');
  const [reportMonth, setReportMonth] = useState('apr');

  const { financialYear } = settings;
  const entries = Object.values(billingEntries);

  // Filter entries by selected month
  const monthEntries = useMemo(() => {
    return entries.filter(e => e.month === reportMonth);
  }, [entries, reportMonth]);

  // Calculate dashboard stats
  const dashboardStats = useMemo(() => {
    const totalClients = clients.length;
    const totalEntries = entries.length;
    const draftCount = entries.filter(e => e.status === 'draft').length;
    const submittedCount = entries.filter(e => e.status === 'submitted').length;
    const totalCommission = entries.reduce((sum, e) => sum + (e.totalCommission || 0), 0);
    const totalInvoice = entries.reduce((sum, e) => sum + (e.totalInvoice || 0), 0);
    
    return { totalClients, totalEntries, draftCount, submittedCount, totalCommission, totalInvoice };
  }, [clients, entries]);

  // Export to CSV
  const exportCSV = (reportType) => {
    let csv = '';
    let filename = '';

    switch (reportType) {
      case 'client-master':
        csv = 'Client ID,Client Name,Type,Service Fee\n';
        clients.forEach(client => {
          csv += `${client.clientId},"${client.name}","${client.type}",${(client.fee * 100).toFixed(0)}%\n`;
        });
        filename = 'MRM_Client_Master_Report.csv';
        break;

      case 'royalty':
        csv = 'Client ID,Client Name,Month,IPRS,PRS GBP,PRS INR,Sound Ex,ISAMRA,ASCAP,PPL,Total\n';
        monthEntries.forEach(e => {
          const total = (e.iprsAmt || 0) + (e.prsAmt || 0) + (e.soundExAmt || 0) + (e.isamraAmt || 0) + (e.ascapAmt || 0) + (e.pplAmt || 0);
          csv += `${e.clientId},"${e.clientName}","${e.monthLabel}",${e.iprsAmt || 0},${e.prsGbp || 0},${e.prsAmt || 0},${e.soundExAmt || 0},${e.isamraAmt || 0},${e.ascapAmt || 0},${e.pplAmt || 0},${total}\n`;
        });
        filename = `MRM_Royalty_Report_${reportMonth}.csv`;
        break;

      case 'commission':
        csv = 'Client ID,Client Name,Month,Fee %,IPRS Comis,PRS Comis,Sound Ex,ISAMRA,ASCAP,PPL,Total Commission\n';
        monthEntries.forEach(e => {
          csv += `${e.clientId},"${e.clientName}","${e.monthLabel}",${((e.serviceFee || 0) * 100).toFixed(0)}%,${e.iprsComis || 0},${e.prsComis || 0},${e.soundExComis || 0},${e.isamraComis || 0},${e.ascapComis || 0},${e.pplComis || 0},${e.totalCommission || 0}\n`;
        });
        filename = `MRM_Commission_Report_${reportMonth}.csv`;
        break;

      case 'gst':
        csv = 'Client ID,Client Name,Month,Total Commission,GST %,GST Amount,Total Invoice\n';
        monthEntries.forEach(e => {
          csv += `${e.clientId},"${e.clientName}","${e.monthLabel}",${e.totalCommission || 0},18%,${e.gst || 0},${e.totalInvoice || 0}\n`;
        });
        filename = `MRM_GST_Report_${reportMonth}.csv`;
        break;

      case 'invoice':
        csv = 'Client ID,Client Name,Month,Invoice Value,Status,Date\n';
        monthEntries.forEach(e => {
          csv += `${e.clientId},"${e.clientName}","${e.monthLabel}",${e.totalInvoice || 0},${e.status},${e.invoiceDate ? new Date(e.invoiceDate).toLocaleDateString('en-IN') : '-'}\n`;
        });
        filename = `MRM_Invoice_Report_${reportMonth}.csv`;
        break;

      default:
        return;
    }

    // Download CSV
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Navigation items
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'home' },
    { id: 'client-master', label: 'Client Master', icon: 'users' },
    { id: 'royalty', label: 'Royalty Report', icon: 'dollar' },
    { id: 'commission', label: 'Commission Report', icon: 'percent' },
    { id: 'gst', label: 'GST Report', icon: 'file' },
    { id: 'invoice', label: 'Invoice Report', icon: 'receipt' },
    { id: 'outstanding', label: 'Outstanding', icon: 'alert' },
  ];

  return (
    <div className="reports-overlay show">
      {/* Sidebar */}
      <div className="reports-sidebar">
        <div className="reports-sidebar-header">
          <div className="logo-row">
            <div className="logo-icon" style={{ width: 42, height: 42, fontSize: 16 }}>MRM</div>
            <div>
              <h1 style={{ fontSize: 18 }}>Reports</h1>
              <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                FY {financialYear.startYear}-{financialYear.endYear}
              </span>
            </div>
          </div>
          <button className="reports-close-btn" onClick={onClose}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="nav-section">
          <div className="nav-section-title">Reports</div>
          {navItems.map(item => (
            <button
              key={item.id}
              className={`nav-item ${activeReport === item.id ? 'active' : ''}`}
              onClick={() => setActiveReport(item.id)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {item.icon === 'home' && <><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></>}
                {item.icon === 'users' && <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></>}
                {item.icon === 'dollar' && <><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></>}
                {item.icon === 'percent' && <><line x1="19" y1="5" x2="5" y2="19"></line><circle cx="6.5" cy="6.5" r="2.5"></circle><circle cx="17.5" cy="17.5" r="2.5"></circle></>}
                {item.icon === 'file' && <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></>}
                {item.icon === 'receipt' && <><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1z"></path><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"></path></>}
                {item.icon === 'alert' && <><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></>}
              </svg>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="reports-main">
        {/* Dashboard */}
        {activeReport === 'dashboard' && (
          <div className="report-section active">
            <div className="report-page-header">
              <div className="report-page-title">
                <h2>Reports Dashboard</h2>
                <p>Overview of billing data for FY {financialYear.startYear}-{financialYear.endYear}</p>
              </div>
            </div>
            <div className="stats-grid">
              <div className="stat-card" style={{ '--card-accent': 'var(--accent-blue)' }}>
                <div className="stat-label">Total Clients</div>
                <div className="stat-value">{dashboardStats.totalClients}</div>
              </div>
              <div className="stat-card" style={{ '--card-accent': 'var(--accent-purple)' }}>
                <div className="stat-label">Total Entries</div>
                <div className="stat-value">{dashboardStats.totalEntries}</div>
              </div>
              <div className="stat-card" style={{ '--card-accent': 'var(--accent-orange)' }}>
                <div className="stat-label">Drafts</div>
                <div className="stat-value">{dashboardStats.draftCount}</div>
              </div>
              <div className="stat-card" style={{ '--card-accent': 'var(--accent-green)' }}>
                <div className="stat-label">Submitted</div>
                <div className="stat-value">{dashboardStats.submittedCount}</div>
              </div>
            </div>
            <div className="stats-grid">
              <div className="stat-card" style={{ '--card-accent': 'var(--accent-blue)' }}>
                <div className="stat-label">Total Commission</div>
                <div className="stat-value">{formatCurrency(dashboardStats.totalCommission)}</div>
              </div>
              <div className="stat-card" style={{ '--card-accent': 'var(--accent-green)' }}>
                <div className="stat-label">Total Invoice Value</div>
                <div className="stat-value">{formatCurrency(dashboardStats.totalInvoice)}</div>
              </div>
            </div>
          </div>
        )}

        {/* Client Master Report */}
        {activeReport === 'client-master' && (
          <div className="report-section active">
            <div className="report-page-header">
              <div className="report-page-title">
                <h2>Client Master Report</h2>
                <p>Complete list of all registered clients</p>
              </div>
              <button className="btn btn-primary" onClick={() => exportCSV('client-master')}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                Export CSV
              </button>
            </div>
            <div className="report-container">
              <div className="report-header">
                <h3>All Clients <span className="count">{clients.length}</span></h3>
              </div>
              <div className="table-wrapper">
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>Client</th>
                      <th>Type</th>
                      <th>Service Fee</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clients.map(client => (
                      <tr key={client.clientId}>
                        <td>
                          <div className="client-cell">
                            <div className="client-avatar">{getClientInitials(client.name)}</div>
                            <div className="client-info">
                              <div className="name">{client.name}</div>
                              <div className="id">{client.clientId}</div>
                            </div>
                          </div>
                        </td>
                        <td>{client.type}</td>
                        <td><span className="amount highlight">{(client.fee * 100).toFixed(0)}%</span></td>
                        <td><span className={`status-badge ${client.isActive !== false ? 'yes' : 'no'}`}>
                          {client.isActive !== false ? 'Active' : 'Inactive'}
                        </span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Royalty Report */}
        {activeReport === 'royalty' && (
          <div className="report-section active">
            <div className="report-page-header">
              <div className="report-page-title">
                <h2>Royalty Report</h2>
                <p>Royalty income breakdown by source</p>
              </div>
              <button className="btn btn-primary" onClick={() => exportCSV('royalty')}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                Export CSV
              </button>
            </div>
            <div className="filter-bar">
              <div className="filter-group">
                <label>Month</label>
                <select value={reportMonth} onChange={(e) => setReportMonth(e.target.value)}>
                  {MONTH_OPTIONS.map(m => (
                    <option key={m.key} value={m.key}>
                      {m.label} {['jan', 'feb', 'mar'].includes(m.key) ? financialYear.endYear : financialYear.startYear}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="report-container">
              <div className="report-header">
                <h3>Royalty Data <span className="count">{monthEntries.length} entries</span></h3>
              </div>
              <div className="table-wrapper">
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>Client</th>
                      <th>IPRS (₹)</th>
                      <th>PRS (£)</th>
                      <th>PRS (₹)</th>
                      <th>Sound Ex</th>
                      <th>ISAMRA</th>
                      <th>ASCAP</th>
                      <th>PPL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthEntries.length === 0 ? (
                      <tr>
                        <td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: 40 }}>
                          No entries for this month
                        </td>
                      </tr>
                    ) : (
                      monthEntries.map((entry, idx) => (
                        <tr key={idx}>
                          <td>
                            <div className="client-cell">
                              <div className="client-avatar">{getClientInitials(entry.clientName)}</div>
                              <div className="client-info">
                                <div className="name">{entry.clientName}</div>
                                <div className="id">{entry.clientId}</div>
                              </div>
                            </div>
                          </td>
                          <td><span className="amount">{formatCurrency(entry.iprsAmt)}</span></td>
                          <td><span className="amount">£{(entry.prsGbp || 0).toFixed(2)}</span></td>
                          <td><span className="amount">{formatCurrency(entry.prsAmt)}</span></td>
                          <td><span className="amount">{formatCurrency(entry.soundExAmt)}</span></td>
                          <td><span className="amount">{formatCurrency(entry.isamraAmt)}</span></td>
                          <td><span className="amount">{formatCurrency(entry.ascapAmt)}</span></td>
                          <td><span className="amount">{formatCurrency(entry.pplAmt)}</span></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Commission Report */}
        {activeReport === 'commission' && (
          <div className="report-section active">
            <div className="report-page-header">
              <div className="report-page-title">
                <h2>Commission Report</h2>
                <p>Commission calculations by client</p>
              </div>
              <button className="btn btn-primary" onClick={() => exportCSV('commission')}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                Export CSV
              </button>
            </div>
            <div className="filter-bar">
              <div className="filter-group">
                <label>Month</label>
                <select value={reportMonth} onChange={(e) => setReportMonth(e.target.value)}>
                  {MONTH_OPTIONS.map(m => (
                    <option key={m.key} value={m.key}>
                      {m.label} {['jan', 'feb', 'mar'].includes(m.key) ? financialYear.endYear : financialYear.startYear}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="report-container">
              <div className="report-header">
                <h3>Commission Data <span className="count">{monthEntries.length} entries</span></h3>
              </div>
              <div className="table-wrapper">
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>Client</th>
                      <th>Fee %</th>
                      <th>IPRS</th>
                      <th>PRS</th>
                      <th>Sound Ex</th>
                      <th>ISAMRA</th>
                      <th>ASCAP</th>
                      <th>PPL</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthEntries.length === 0 ? (
                      <tr>
                        <td colSpan="9" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: 40 }}>
                          No entries for this month
                        </td>
                      </tr>
                    ) : (
                      <>
                        {monthEntries.map((entry, idx) => (
                          <tr key={idx}>
                            <td>
                              <div className="client-cell">
                                <div className="client-avatar">{getClientInitials(entry.clientName)}</div>
                                <div className="client-info">
                                  <div className="name">{entry.clientName}</div>
                                </div>
                              </div>
                            </td>
                            <td><span className="amount">{((entry.serviceFee || 0) * 100).toFixed(0)}%</span></td>
                            <td><span className="amount">{formatCurrency(entry.iprsComis)}</span></td>
                            <td><span className="amount">{formatCurrency(entry.prsComis)}</span></td>
                            <td><span className="amount">{formatCurrency(entry.soundExComis)}</span></td>
                            <td><span className="amount">{formatCurrency(entry.isamraComis)}</span></td>
                            <td><span className="amount">{formatCurrency(entry.ascapComis)}</span></td>
                            <td><span className="amount">{formatCurrency(entry.pplComis)}</span></td>
                            <td><span className="amount positive">{formatCurrency(entry.totalCommission)}</span></td>
                          </tr>
                        ))}
                        <tr className="summary-row">
                          <td colSpan="8"><strong>Total</strong></td>
                          <td><span className="amount positive">{formatCurrency(monthEntries.reduce((sum, e) => sum + (e.totalCommission || 0), 0))}</span></td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* GST Report */}
        {activeReport === 'gst' && (
          <div className="report-section active">
            <div className="report-page-header">
              <div className="report-page-title">
                <h2>GST Report</h2>
                <p>GST calculations at 18%</p>
              </div>
              <button className="btn btn-primary" onClick={() => exportCSV('gst')}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                Export CSV
              </button>
            </div>
            <div className="filter-bar">
              <div className="filter-group">
                <label>Month</label>
                <select value={reportMonth} onChange={(e) => setReportMonth(e.target.value)}>
                  {MONTH_OPTIONS.map(m => (
                    <option key={m.key} value={m.key}>
                      {m.label} {['jan', 'feb', 'mar'].includes(m.key) ? financialYear.endYear : financialYear.startYear}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="report-container">
              <div className="report-header">
                <h3>GST Data <span className="count">{monthEntries.length} entries</span></h3>
              </div>
              <div className="table-wrapper">
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>Client</th>
                      <th>Total Commission</th>
                      <th>GST Rate</th>
                      <th>GST Amount</th>
                      <th>Total Invoice</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthEntries.length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: 40 }}>
                          No entries for this month
                        </td>
                      </tr>
                    ) : (
                      <>
                        {monthEntries.map((entry, idx) => (
                          <tr key={idx}>
                            <td>
                              <div className="client-cell">
                                <div className="client-avatar">{getClientInitials(entry.clientName)}</div>
                                <div className="client-info">
                                  <div className="name">{entry.clientName}</div>
                                </div>
                              </div>
                            </td>
                            <td><span className="amount">{formatCurrency(entry.totalCommission)}</span></td>
                            <td>18%</td>
                            <td><span className="amount">{formatCurrency(entry.gst)}</span></td>
                            <td><span className="amount positive">{formatCurrency(entry.totalInvoice)}</span></td>
                          </tr>
                        ))}
                        <tr className="summary-row">
                          <td colSpan="3"><strong>Total</strong></td>
                          <td><span className="amount">{formatCurrency(monthEntries.reduce((sum, e) => sum + (e.gst || 0), 0))}</span></td>
                          <td><span className="amount positive">{formatCurrency(monthEntries.reduce((sum, e) => sum + (e.totalInvoice || 0), 0))}</span></td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Invoice Report */}
        {activeReport === 'invoice' && (
          <div className="report-section active">
            <div className="report-page-header">
              <div className="report-page-title">
                <h2>Invoice Report</h2>
                <p>Invoice status and amounts</p>
              </div>
              <button className="btn btn-primary" onClick={() => exportCSV('invoice')}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                Export CSV
              </button>
            </div>
            <div className="filter-bar">
              <div className="filter-group">
                <label>Month</label>
                <select value={reportMonth} onChange={(e) => setReportMonth(e.target.value)}>
                  {MONTH_OPTIONS.map(m => (
                    <option key={m.key} value={m.key}>
                      {m.label} {['jan', 'feb', 'mar'].includes(m.key) ? financialYear.endYear : financialYear.startYear}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="report-container">
              <div className="report-header">
                <h3>Invoice Data <span className="count">{monthEntries.length} entries</span></h3>
              </div>
              <div className="table-wrapper">
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>Client</th>
                      <th>Month</th>
                      <th>Invoice Value</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthEntries.length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: 40 }}>
                          No entries for this month
                        </td>
                      </tr>
                    ) : (
                      monthEntries.map((entry, idx) => (
                        <tr key={idx}>
                          <td>
                            <div className="client-cell">
                              <div className="client-avatar">{getClientInitials(entry.clientName)}</div>
                              <div className="client-info">
                                <div className="name">{entry.clientName}</div>
                                <div className="id">{entry.clientId}</div>
                              </div>
                            </div>
                          </td>
                          <td>{entry.monthLabel}</td>
                          <td><span className="amount positive">{formatCurrency(entry.totalInvoice)}</span></td>
                          <td>
                            <span className={`status-badge ${entry.status === 'submitted' ? 'yes' : 'pending'}`}>
                              {entry.status || 'Draft'}
                            </span>
                          </td>
                          <td>{entry.invoiceDate ? new Date(entry.invoiceDate).toLocaleDateString('en-IN') : '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Outstanding Report */}
        {activeReport === 'outstanding' && (
          <div className="report-section active">
            <div className="report-page-header">
              <div className="report-page-title">
                <h2>Outstanding Report</h2>
                <p>Entries pending submission</p>
              </div>
            </div>
            <div className="stats-grid">
              <div className="stat-card" style={{ '--card-accent': 'var(--accent-blue)' }}>
                <div className="stat-label">Clients with Entries</div>
                <div className="stat-value">{new Set(entries.map(e => e.clientId)).size}</div>
              </div>
              <div className="stat-card" style={{ '--card-accent': 'var(--accent-orange)' }}>
                <div className="stat-label">Total Drafts</div>
                <div className="stat-value">{dashboardStats.draftCount}</div>
              </div>
              <div className="stat-card" style={{ '--card-accent': 'var(--accent-green)' }}>
                <div className="stat-label">Total Submitted</div>
                <div className="stat-value">{dashboardStats.submittedCount}</div>
              </div>
              <div className="stat-card" style={{ '--card-accent': 'var(--accent-purple)' }}>
                <div className="stat-label">Total Value</div>
                <div className="stat-value">{formatCurrency(dashboardStats.totalInvoice)}</div>
              </div>
            </div>
            <div className="report-container">
              <div className="report-header">
                <h3>Client Status</h3>
              </div>
              <div className="table-wrapper">
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>Client</th>
                      <th>Draft Entries</th>
                      <th>Submitted Entries</th>
                      <th>Total Value</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clients.map(client => {
                      const clientEntries = entries.filter(e => e.clientId === client.clientId);
                      const draftCount = clientEntries.filter(e => e.status === 'draft').length;
                      const submittedCount = clientEntries.filter(e => e.status === 'submitted').length;
                      const totalValue = clientEntries.reduce((sum, e) => sum + (e.totalInvoice || 0), 0);
                      
                      if (clientEntries.length === 0) return null;
                      
                      return (
                        <tr key={client.clientId}>
                          <td>
                            <div className="client-cell">
                              <div className="client-avatar">{getClientInitials(client.name)}</div>
                              <div className="client-info">
                                <div className="name">{client.name}</div>
                                <div className="id">{client.clientId}</div>
                              </div>
                            </div>
                          </td>
                          <td><span className={`amount ${draftCount > 0 ? 'negative' : ''}`}>{draftCount}</span></td>
                          <td><span className="amount positive">{submittedCount}</span></td>
                          <td><span className="amount highlight">{formatCurrency(totalValue)}</span></td>
                          <td>
                            <span className={`status-badge ${draftCount === 0 ? 'yes' : 'pending'}`}>
                              {draftCount === 0 ? 'Complete' : 'Pending'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ReportsPanel;
