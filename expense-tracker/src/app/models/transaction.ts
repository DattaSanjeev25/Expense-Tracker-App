export enum TransactionType {
    Income,
    Expense
}

export interface Transaction {
    id: string;
    userId: string;
    amount: number;
    description: string;
    type: TransactionType;
    createdAt: Date;
    updatedAt?: Date;
}

export interface TransactionFilter {
    startDate?: Date;
    endDate?: Date;
    month?: number;
    year?: number;
} 