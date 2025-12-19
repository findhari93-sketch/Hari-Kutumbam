import Papa from 'papaparse';

export interface DraftTransaction {
    date: string;
    description: string;
    amount: number;
    type: 'expense' | 'income';
    raw: any;
}

export const parseBankCSV = (file: File): Promise<DraftTransaction[]> => {
    return new Promise((resolve, reject) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const transactions: DraftTransaction[] = [];

                results.data.forEach((row: any) => {
                    // Heuristic to identify columns
                    const dateVal = row['Date'] || row['Transaction Date'] || row['Value Date'];
                    const descVal = row['Description'] || row['Narration'] || row['Remarks'];
                    const debitVal = row['Debit'] || row['Withdrawal'] || row['Dr'];
                    const creditVal = row['Credit'] || row['Deposit'] || row['Cr'];

                    if (!dateVal || (!debitVal && !creditVal)) return;

                    let amount = 0;
                    let type: 'expense' | 'income' = 'expense';

                    if (creditVal && parseFloat(creditVal) > 0) {
                        amount = parseFloat(creditVal);
                        type = 'income';
                    } else if (debitVal && parseFloat(debitVal) > 0) {
                        amount = parseFloat(debitVal);
                        type = 'expense';
                    }

                    if (amount > 0) {
                        transactions.push({
                            date: dateVal, // Might need formatting
                            description: descVal,
                            amount,
                            type,
                            raw: row
                        });
                    }
                });

                resolve(transactions);
            },
            error: (error) => {
                reject(error);
            }
        });
    });
};
