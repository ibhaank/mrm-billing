import React from 'react';
import { useApp } from '../contexts/AppContext';
import { useBillingForm } from '../hooks/useBillingForm';

// Helper to format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
};

// Month labels mapping
const monthLabels = {
  apr: 'April', may: 'May', jun: 'June', jul: 'July',
  aug: 'August', sep: 'September', oct: 'October', nov: 'November',
  dec: 'December', jan: 'January', feb: 'February', mar: 'March',
};

function BillingForm() {
  const { selectedClient, currentMonth, settings, showToast } = useApp();
  const {
    formData,
    calculations,
    handleInputChange,
    clearForm,
    handleSaveAsDraft,
    handleSubmit,
    handleDelete,
    status,
    serviceFee,
  } = useBillingForm();

  const { financialYear } = settings;
  const year = ['jan', 'feb', 'mar'].includes(currentMonth)
    ? financialYear.endYear
    : financialYear.startYear;

  const monthLabel = `${monthLabels[currentMonth]} ${year}`;

  const onSaveDraft = async () => {
    try {
      await handleSaveAsDraft();
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  const onSubmit = async () => {
    try {
      await handleSubmit();
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  const onClear = async () => {
    if (!selectedClient) {
      showToast('Please select a client first', 'warning');
      return;
    }
    if (window.confirm('Are you sure you want to clear all form data?')) {
      try {
        if (status) {
          await handleDelete();
        } else {
          clearForm();
        }
        showToast('Form cleared!');
      } catch (error) {
        showToast(error.message, 'error');
      }
    }
  };

  if (!selectedClient) {
    return (
      <main className="data-form">
        <div className="empty-state" style={{ padding: '80px 20px' }}>
          <h3>Select a Client</h3>
          <p>Choose a client from the panel on the left to begin entering billing data</p>
        </div>
      </main>
    );
  }

  return (
    <main className="data-form">
      {/* Form Header */}
      <div className="form-header">
        <div className="form-header-info">
          <h2>
            {selectedClient.name}
            {status && (
              <span className={`status-indicator ${status === 'submitted' ? 'submitted' : 'draft'}`}>
                <span className="dot"></span>
                {status === 'submitted' ? 'Submitted' : 'Draft'}
              </span>
            )}
          </h2>
          <span>{selectedClient.clientId} • Service Fee: {(serviceFee * 100).toFixed(0)}%</span>
        </div>
        <div className="month-badge">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          {monthLabel}
        </div>
      </div>

      <div className="form-body">
        {/* Royalty Income Section */}
        <div className="section">
          <div className="section-header">
            <div className="section-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="1" x2="12" y2="23"></line>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
              </svg>
            </div>
            <div>
              <div className="section-title">Royalty Income</div>
              <div className="section-subtitle">Enter royalty amounts from various sources</div>
            </div>
          </div>
          <div className="input-grid">
            <div className="input-group">
              <label>IPRS Amount (₹)</label>
              <div className="input-prefix">
                <span>₹</span>
                <input
                  type="number"
                  name="iprsAmt"
                  value={formData.iprsAmt}
                  onChange={handleInputChange}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="input-group">
              <label>PRS Amount (£)</label>
              <div className="input-prefix">
                <span>£</span>
                <input
                  type="number"
                  name="prsGbp"
                  value={formData.prsGbp}
                  onChange={handleInputChange}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="input-group">
              <label>GBP to INR Rate</label>
              <div className="input-prefix">
                <span>₹</span>
                <input
                  type="number"
                  name="gbpToInrRate"
                  value={formData.gbpToInrRate}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  step="0.01"
                />
              </div>
            </div>
            <div className="input-group">
              <label>PRS Amount (₹)</label>
              <div className="input-prefix">
                <span>₹</span>
                <input
                  type="number"
                  name="prsAmt"
                  value={formData.prsAmt}
                  onChange={handleInputChange}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="input-group">
              <label>Sound Exchange ($)</label>
              <div className="input-prefix">
                <span>$</span>
                <input
                  type="number"
                  name="soundExUsd"
                  value={formData.soundExUsd}
                  onChange={handleInputChange}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="input-group">
              <label>USD to INR Rate</label>
              <div className="input-prefix">
                <span>₹</span>
                <input
                  type="number"
                  name="usdToInrRate"
                  value={formData.usdToInrRate}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  step="0.01"
                />
              </div>
            </div>
            <div className="input-group">
              <label>Sound Exchange (₹)</label>
              <div className="input-prefix">
                <span>₹</span>
                <input
                  type="number"
                  name="soundExAmt"
                  value={formData.soundExAmt}
                  onChange={handleInputChange}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="input-group">
              <label>ISAMRA Amount (₹)</label>
              <div className="input-prefix">
                <span>₹</span>
                <input
                  type="number"
                  name="isamraAmt"
                  value={formData.isamraAmt}
                  onChange={handleInputChange}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="input-group">
              <label>ASCAP Amount ($)</label>
              <div className="input-prefix">
                <span>$</span>
                <input
                  type="number"
                  name="ascapUsd"
                  value={formData.ascapUsd}
                  onChange={handleInputChange}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="input-group">
              <label>ASCAP Amount (₹)</label>
              <div className="input-prefix">
                <span>₹</span>
                <input
                  type="number"
                  name="ascapAmt"
                  value={formData.ascapAmt}
                  onChange={handleInputChange}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="input-group">
              <label>PPL Amount (₹)</label>
              <div className="input-prefix">
                <span>₹</span>
                <input
                  type="number"
                  name="pplAmt"
                  value={formData.pplAmt}
                  onChange={handleInputChange}
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Commission Section */}
        <div className="section">
          <div className="section-header">
            <div className="section-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
              </svg>
            </div>
            <div>
              <div className="section-title">Commission Calculation</div>
              <div className="section-subtitle">Auto-calculated based on {(serviceFee * 100).toFixed(0)}% service fee</div>
            </div>
          </div>
          <div className="input-grid">
            <div className="input-group calculated">
              <label>IPRS Commission</label>
              <div className="input-prefix">
                <span>₹</span>
                <input type="number" value={calculations.iprsComis.toFixed(2)} readOnly />
              </div>
            </div>
            <div className="input-group calculated">
              <label>PRS Commission</label>
              <div className="input-prefix">
                <span>₹</span>
                <input type="number" value={calculations.prsComis.toFixed(2)} readOnly />
              </div>
            </div>
            <div className="input-group calculated">
              <label>Sound Ex Commission</label>
              <div className="input-prefix">
                <span>₹</span>
                <input type="number" value={calculations.soundExComis.toFixed(2)} readOnly />
              </div>
            </div>
            <div className="input-group calculated">
              <label>ISAMRA Commission</label>
              <div className="input-prefix">
                <span>₹</span>
                <input type="number" value={calculations.isamraComis.toFixed(2)} readOnly />
              </div>
            </div>
            <div className="input-group calculated">
              <label>ASCAP Commission</label>
              <div className="input-prefix">
                <span>₹</span>
                <input type="number" value={calculations.ascapComis.toFixed(2)} readOnly />
              </div>
            </div>
            <div className="input-group calculated">
              <label>PPL Commission</label>
              <div className="input-prefix">
                <span>₹</span>
                <input type="number" value={calculations.pplComis.toFixed(2)} readOnly />
              </div>
            </div>
          </div>
        </div>

        {/* Remarks Section */}
        <div className="section">
          <div className="section-header">
            <div className="section-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
            </div>
            <div>
              <div className="section-title">Remarks & Notes</div>
              <div className="section-subtitle">Additional information for this billing entry</div>
            </div>
          </div>
          <div className="remarks-grid">
            <div className="remarks-box iprs">
              <label><span className="dot"></span>IPRS Remarks</label>
              <textarea
                name="iprsRemarks"
                value={formData.iprsRemarks}
                onChange={handleInputChange}
                placeholder="Enter IPRS related notes..."
              />
            </div>
            <div className="remarks-box prs">
              <label><span className="dot"></span>PRS Remarks</label>
              <textarea
                name="prsRemarks"
                value={formData.prsRemarks}
                onChange={handleInputChange}
                placeholder="Enter PRS related notes..."
              />
            </div>
          </div>
        </div>

        {/* Invoice Details Section */}
        <div className="section">
          <div className="section-header">
            <div className="section-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
              </svg>
            </div>
            <div>
              <div className="section-title">Invoice Details</div>
              <div className="section-subtitle">Invoice date and payment status</div>
            </div>
          </div>
          <div className="input-grid">
            <div className="input-group">
              <label>Invoice Date</label>
              <input
                type="date"
                name="invoiceDate"
                value={formData.invoiceDate}
                onChange={handleInputChange}
              />
            </div>
            <div className="input-group">
              <label>Invoice Status</label>
              <select
                name="invoiceStatus"
                value={formData.invoiceStatus}
                onChange={handleInputChange}
              >
                <option value="draft">Draft</option>
                <option value="bill_sent">Bill Sent</option>
                <option value="amount_received">Amount Received</option>
                <option value="outstanding">Outstanding Payment</option>
                <option value="submitted">Submitted</option>
              </select>
            </div>
          </div>
        </div>

        {/* Outstanding Section */}
        <div className="section">
          <div className="section-header">
            <div className="section-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
              </svg>
            </div>
            <div>
              <div className="section-title">Outstanding</div>
              <div className="section-subtitle">Track outstanding payments</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, flexWrap: 'wrap' }}>
            <div className="input-group" style={{ flex: 1, minWidth: 140 }}>
              <label>Previous Outstanding (₹)</label>
              <div className="input-prefix">
                <span>₹</span>
                <input
                  type="number"
                  name="previousOutstanding"
                  value={formData.previousOutstanding}
                  onChange={handleInputChange}
                  placeholder="0.00"
                />
              </div>
            </div>
            <select
              name="outstandingOperator"
              value={formData.outstandingOperator || '+'}
              onChange={handleInputChange}
              style={{
                width: 50,
                height: 44,
                textAlign: 'center',
                fontSize: 18,
                fontWeight: 'bold',
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                marginBottom: 0,
              }}
            >
              <option value="+">+</option>
              <option value="-">−</option>
            </select>
            <div className="input-group" style={{ flex: 1, minWidth: 140 }}>
              <label>Current Month Outstanding (₹)</label>
              <div className="input-prefix">
                <span>₹</span>
                <input
                  type="number"
                  name="currentMonthOutstanding"
                  value={formData.currentMonthOutstanding}
                  onChange={handleInputChange}
                  placeholder="0.00"
                />
              </div>
            </div>
            <button
              type="button"
              className="btn btn-primary"
              style={{
                height: 44,
                width: 44,
                minWidth: 'auto',
                padding: 0,
                fontSize: 20,
                fontWeight: 'bold',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 0,
              }}
              onClick={() => {
                const prev = parseFloat(formData.previousOutstanding) || 0;
                const curr = parseFloat(formData.currentMonthOutstanding) || 0;
                const op = formData.outstandingOperator || '+';
                const total = op === '+' ? prev + curr : prev - curr;
                handleInputChange({
                  target: { name: 'totalOutstanding', value: total.toFixed(2) }
                });
              }}
              title="Calculate Total Outstanding"
            >
              =
            </button>
            <div className="input-group" style={{ flex: 1, minWidth: 140 }}>
              <label>Total Outstanding (₹)</label>
              <div className="input-prefix">
                <span>₹</span>
                <input
                  type="number"
                  name="totalOutstanding"
                  value={formData.totalOutstanding}
                  onChange={handleInputChange}
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Summary Card */}
        <div className="summary-card">
          <div className="summary-header">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23"></line>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
            <h3>Billing Summary</h3>
          </div>
          <div className="summary-grid">
            <div className="summary-item">
              <div className="label">Total Commission</div>
              <div className="value">{formatCurrency(calculations.totalCommission)}</div>
            </div>
            <div className="summary-item">
              <div className="label">GST (18%)</div>
              <div className="value">{formatCurrency(calculations.gst)}</div>
            </div>
            <div className="summary-item">
              <div className="label">Total Invoice</div>
              <div className="value">{formatCurrency(calculations.totalInvoice)}</div>
            </div>
            <div className="summary-item">
              <div className="label">Total Outstanding</div>
              <div className="value">{formatCurrency(parseFloat(formData.totalOutstanding) || 0)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="form-actions">
        <button className="btn btn-danger" onClick={onClear}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
          Clear Form
        </button>
        <button className="btn btn-secondary" onClick={onSaveDraft}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
            <polyline points="17 21 17 13 7 13 7 21"></polyline>
            <polyline points="7 3 7 8 15 8"></polyline>
          </svg>
          Save Draft
        </button>
        <button className="btn btn-success" onClick={onSubmit}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          Submit Entry
        </button>
      </div>
    </main>
  );
}

export default BillingForm;
