import { useState, useCallback, useEffect, useMemo } from 'react';
import { useApp } from '../contexts/AppContext';

const initialFormState = {
  iprsAmt: '',
  prsGbp: '',
  prsAmt: '',
  soundExUsd: '',
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

  // Exchange rates from settings
  const gbpToInrRate = settings.gbpToInrRate || 110.50;
  const usdToInrRate = settings.usdToInrRate || 83.50;

  // GST rate
  const gstRate = settings.gstRate || 0.18;

  // Load entry data when currentEntry, selectedClient, or currentMonth changes
  useEffect(() => {
    if (currentEntry) {
      setFormData({
        iprsAmt: currentEntry.iprsAmt || '',
        prsGbp: currentEntry.prsGbp || '',
        prsAmt: currentEntry.prsAmt || '',
        soundExUsd: currentEntry.soundExUsd || '',
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
    }
  }, [currentEntry, selectedClient, currentMonth]);

  // Calculate derived values
  const calculations = useMemo(() => {
    const iprsAmt = parseFloat(formData.iprsAmt) || 0;
    const prsGbp = parseFloat(formData.prsGbp) || 0;
    const soundExUsd = parseFloat(formData.soundExUsd) || 0;
    const isamraAmt = parseFloat(formData.isamraAmt) || 0;
    const ascapUsd = parseFloat(formData.ascapUsd) || 0;
    const pplAmt = parseFloat(formData.pplAmt) || 0;

    // Currency conversions
    const prsAmt = prsGbp * gbpToInrRate;
    const soundExAmt = soundExUsd * usdToInrRate;
    const ascapAmt = ascapUsd * usdToInrRate;

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
      prsAmt,
      soundExAmt,
      ascapAmt,
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
  }, [formData.iprsAmt, formData.prsGbp, formData.soundExUsd, formData.isamraAmt,
      formData.ascapUsd, formData.pplAmt, gbpToInrRate, usdToInrRate, serviceFee, gstRate]);

  // Update field
  const updateField = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  }, []);

  // Handle input change
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    updateField(name, value);
  }, [updateField]);

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
    gbpToInrRate,
    usdToInrRate,
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
