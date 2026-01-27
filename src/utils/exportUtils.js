export const generateCSV = (transactions, categories, accounts) => {
    // Header row
    const headers = ['Date', 'Merchant', 'Category', 'Amount', 'Currency', 'Account', 'Note', 'Type'];

    // Data rows
    const rows = transactions.map(t => {
        const categoryName = categories.find(c => c.id === t.category)?.name || t.category || 'Uncategorized';
        const accountName = accounts.find(a => a.id === t.accountId)?.name || 'N/A';

        // Escape content that might contain commas
        const cleanMerchant = `"${(t.merchant || '').replace(/"/g, '""')}"`;
        const cleanNote = `"${(t.note || '').replace(/"/g, '""')}"`;

        return [
            t.date,
            cleanMerchant,
            categoryName,
            t.total,
            t.currency || 'USD',
            accountName,
            cleanNote,
            t.type
        ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');

    // Trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `horizon_transactions_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
