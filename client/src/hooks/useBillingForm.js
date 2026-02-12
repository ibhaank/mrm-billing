import { useState, useCallback, useEffect, useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import { billingApi } from '../services/api';

const initialFormState = {
  iprsAmt: '',
  prsGbp: '',
  gbpToInrRate: '',
  prsAmt: '',
  soundExUsd: '',
  usdToInrRate: '',
  soundExAmt: '',
  isamraAmt: '',
  ascapUsd: '',
  ascapAmt: '',
  pplAmt: '',
  iprsComis: '',
  prsComis: '',
  soundExComis: '',
  isamraComis: '',
  ascapComis: '',
  pplComis: '',
  totalCommission: 0,
  gst: 0,
  totalInvoice: 0,
  previousOutstanding: '',
  outstandingOperator: '+',
  currentMonthOutstanding: '',
  totalOutstanding: '',
  iprsRemarks: '',
  prsRemarks: '',
  invoiceDate: new Date().toISOString().split('T')[0],
  invoiceStatus: 'draft',
};

export function useBillingForm() {
  const { selectedClient, currentMonth, currentEntry, settings, saveEntry, deleteEntry } = useApp();
  const [formData, setFormData] = useState(initialFormState);
  const [isDirty, setIsDirty] = useState(false);

  // Service fee from selected client
  const serviceFee = selectedClient?.fee || 0;

  // GST rate
  const gstRate = settings.gstRate || 0.18;

  // Load entry data when currentEntry, selectedClient, or currentMonth changes
  useEffect(() => {
    if (currentEntry) {
      setFormData({
        iprsAmt: currentEntry.iprsAmt || '',
        prsGbp: currentEntry.prsGbp || '',
        gbpToInrRate: currentEntry.gbpToInrRate || '',
        prsAmt: currentEntry.prsAmt || '',
        soundExUsd: currentEntry.soundExUsd || '',
        usdToInrRate: currentEntry.usdToInrRate || '',
        soundExAmt: currentEntry.soundExAmt || '',
        isamraAmt: currentEntry.isamraAmt || '',
        ascapUsd: currentEntry.ascapUsd || '',
        ascapAmt: currentEntry.ascapAmt || '',
        pplAmt: currentEntry.pplAmt || '',
        iprsComis: currentEntry.iprsComis || '',
        prsComis: currentEntry.prsComis || '',
        soundExComis: currentEntry.soundExComis || '',
        isamraComis: currentEntry.isamraComis || '',
        ascapComis: currentEntry.ascapComis || '',
        pplComis: currentEntry.pplComis || '',
        totalCommission: currentEntry.totalCommission || 0,
        gst: currentEntry.gst || 0,
        totalInvoice: currentEntry.totalInvoice || 0,
        previousOutstanding: currentEntry.previousOutstanding || '',
        outstandingOperator: currentEntry.outstandingOperator || '+',
        currentMonthOutstanding: currentEntry.currentMonthOutstanding || '',
        totalOutstanding: currentEntry.totalOutstanding || '',
        iprsRemarks: currentEntry.iprsRemarks || '',
        prsRemarks: currentEntry.prsRemarks || '',
        invoiceDate: currentEntry.invoiceDate
          ? new Date(currentEntry.invoiceDate).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        invoiceStatus: currentEntry.invoiceStatus || 'draft',
      });
      setIsDirty(false);
    } else {
      // Clear form when no entry exists for this client/month combination
      setFormData(initialFormState);
      setIsDirty(false);

      // Auto-fetch previous month's total outstanding
      if (selectedClient && currentMonth) {
        const fy = settings.financialYear?.startYear;
        billingApi.getPreviousOutstanding(selectedClient.clientId, currentMonth, fy)
          .then(res => {
            const prevOutstanding = res.data.totalOutstanding;
            if (prevOutstanding) {
              setFormData(prev => ({ ...prev, previousOutstanding: prevOutstanding }));
            }
          })
          .catch(() => {}); // silently ignore if no previous entry
      }
    }
  }, [currentEntry, selectedClient, currentMonth, settings.financialYear]);

  // Calculate derived values
  const calculations = useMemo(() => {
    const iprsAmt = parseFloat(formData.iprsAmt) || 0;
    const prsAmt = parseFloat(formData.prsAmt) || 0;
    const soundExAmt = parseFloat(formData.soundExAmt) || 0;
    const isamraAmt = parseFloat(formData.isamraAmt) || 0;
    const ascapAmt = parseFloat(formData.ascapAmt) || 0;
    const pplAmt = parseFloat(formData.pplAmt) || 0;

    // Commissions
    const iprsComis = iprsAmt * serviceFee;
    const prsComis = prsAmt * serviceFee;
    const soundExComis = soundExAmt * serviceFee;
    const isamraComis = isamraAmt * serviceFee;
    const ascapComis = ascapAmt * serviceFee;
    const pplComis = pplAmt * serviceFee;

    // Totals
    const totalCommission = iprsComis + prsComis + soundExComis + isamraComis + ascapComis + pplComis;
    const gst = totalCommission * gstRate;
    const totalInvoice = totalCommission + gst;

    return {
      iprsComis,
      prsComis,
      soundExComis,
      isamraComis,
      ascapComis,
      pplComis,
      totalCommission,
      gst,
      totalInvoice,
    };
  }, [formData.iprsAmt, formData.prsAmt, formData.soundExAmt, formData.isamraAmt,
      formData.ascapAmt, formData.pplAmt, serviceFee, gstRate]);

  // Update field
  const updateField = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  }, []);

  // Handle input change - auto-calculate INR when currency or rate changes
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const next = { ...prev, [name]: value };

      if (name === 'prsGbp' || name === 'gbpToInrRate') {
        const gbp = parseFloat(next.prsGbp) || 0;
        const rate = parseFloat(next.gbpToInrRate) || 0;
        next.prsAmt = gbp && rate ? (gbp * rate).toFixed(2) : prev.prsAmt;
      }

      if (name === 'soundExUsd' || name === 'usdToInrRate') {
        const usd = parseFloat(next.soundExUsd) || 0;
        const rate = parseFloat(next.usdToInrRate) || 0;
        next.soundExAmt = usd && rate ? (usd * rate).toFixed(2) : prev.soundExAmt;
      }

      if (name === 'ascapUsd' || name === 'usdToInrRate') {
        const usd = parseFloat(next.ascapUsd) || 0;
        const rate = parseFloat(next.usdToInrRate) || 0;
        next.ascapAmt = usd && rate ? (usd * rate).toFixed(2) : prev.ascapAmt;
      }

      return next;
    });
    setIsDirty(true);
  }, []);

  // Clear form
  const clearForm = useCallback(() => {
    setFormData(initialFormState);
    setIsDirty(false);
  }, []);

  // Save as draft
  const handleSaveAsDraft = useCallback(async () => {
    if (!selectedClient) {
      throw new Error('Please select a client first');
    }

    const entryData = {
      clientId: selectedClient.clientId,
      month: currentMonth,
      ...formData,
      ...calculations,
    };

    await saveEntry(entryData, 'draft');
    setIsDirty(false);
  }, [selectedClient, currentMonth, formData, calculations, saveEntry]);

  // Submit entry
  const handleSubmit = useCallback(async () => {
    if (!selectedClient) {
      throw new Error('Please select a client first');
    }

    const entryData = {
      clientId: selectedClient.clientId,
      month: currentMonth,
      ...formData,
      ...calculations,
    };

    await saveEntry(entryData, 'submitted');
    setIsDirty(false);
  }, [selectedClient, currentMonth, formData, calculations, saveEntry]);

  // Delete entry
  const handleDelete = useCallback(async () => {
    if (!selectedClient) {
      throw new Error('Please select a client first');
    }

    await deleteEntry(selectedClient.clientId, currentMonth);
    clearForm();
  }, [selectedClient, currentMonth, deleteEntry, clearForm]);

  return {
    formData,
    calculations,
    isDirty,
    serviceFee,
    handleInputChange,
    updateField,
    clearForm,
    handleSaveAsDraft,
    handleSubmit,
    handleDelete,
    status: currentEntry?.status || currentEntry?.invoiceStatus || null,
  };
}

export default useBillingForm;
