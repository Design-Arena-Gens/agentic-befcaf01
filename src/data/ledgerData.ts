export type LedgerEntry = {
  id: string;
  date: string;
  reference: string;
  particulars: string;
  debit: number;
  credit: number;
};

export type LedgerParty = {
  id: string;
  name: string;
  email: string;
  gstin?: string;
  address?: string;
  entries: LedgerEntry[];
};

export const ledgerParties: LedgerParty[] = [
  {
    id: "abc-company",
    name: "ABC Company Ltd",
    email: "accounts@abccompany.test",
    gstin: "29ABCDE1234F2Z5",
    address: "12, MG Road, Bengaluru, Karnataka - 560001",
    entries: [
      {
        id: "abc-1",
        date: "2024-04-02",
        reference: "INV-2401",
        particulars: "Sales Invoice #INV-2401",
        debit: 0,
        credit: 28650,
      },
      {
        id: "abc-2",
        date: "2024-04-15",
        reference: "RCPT-1460",
        particulars: "Receipt via NEFT",
        debit: 28650,
        credit: 0,
      },
      {
        id: "abc-3",
        date: "2024-05-08",
        reference: "INV-2418",
        particulars: "Sales Invoice #INV-2418",
        debit: 0,
        credit: 41250,
      },
      {
        id: "abc-4",
        date: "2024-06-30",
        reference: "RCPT-1551",
        particulars: "Receipt via RTGS",
        debit: 20000,
        credit: 0,
      },
      {
        id: "abc-5",
        date: "2024-08-03",
        reference: "INV-2452",
        particulars: "Sales Invoice #INV-2452",
        debit: 0,
        credit: 19800,
      },
      {
        id: "abc-6",
        date: "2024-09-05",
        reference: "RCPT-1589",
        particulars: "Receipt via UPI",
        debit: 19800,
        credit: 0,
      },
    ],
  },
  {
    id: "xyz-traders",
    name: "XYZ Traders",
    email: "finance@xyztraders.test",
    gstin: "29XYZDE4567E1Z2",
    address: "45, Brigade Road, Bengaluru, Karnataka - 560025",
    entries: [
      {
        id: "xyz-1",
        date: "2024-04-05",
        reference: "INV-2402",
        particulars: "Sales Invoice #INV-2402",
        debit: 0,
        credit: 15800,
      },
      {
        id: "xyz-2",
        date: "2024-04-30",
        reference: "RCPT-1469",
        particulars: "Receipt via Cheque",
        debit: 15800,
        credit: 0,
      },
      {
        id: "xyz-3",
        date: "2024-07-19",
        reference: "INV-2436",
        particulars: "Sales Invoice #INV-2436",
        debit: 0,
        credit: 22440,
      },
      {
        id: "xyz-4",
        date: "2024-08-12",
        reference: "RCPT-1573",
        particulars: "Receipt via Cash",
        debit: 12000,
        credit: 0,
      },
      {
        id: "xyz-5",
        date: "2024-09-30",
        reference: "DRN-0210",
        particulars: "Debit Note - Short Supply",
        debit: 2440,
        credit: 0,
      },
    ],
  },
  {
    id: "sunrise-enterprises",
    name: "Sunrise Enterprises",
    email: "info@sunriseenterprises.test",
    gstin: "29SUNRI7890N1Z1",
    address: "301, Indiranagar, Bengaluru, Karnataka - 560038",
    entries: [
      {
        id: "sun-1",
        date: "2024-04-01",
        reference: "BAL",
        particulars: "Opening Balance",
        debit: 0,
        credit: 10500,
      },
      {
        id: "sun-2",
        date: "2024-05-11",
        reference: "INV-2422",
        particulars: "Sales Invoice #INV-2422",
        debit: 0,
        credit: 18360,
      },
      {
        id: "sun-3",
        date: "2024-06-15",
        reference: "RCPT-1520",
        particulars: "Receipt via IMPS",
        debit: 15000,
        credit: 0,
      },
      {
        id: "sun-4",
        date: "2024-07-25",
        reference: "INV-2444",
        particulars: "Sales Invoice #INV-2444",
        debit: 0,
        credit: 21960,
      },
      {
        id: "sun-5",
        date: "2024-08-18",
        reference: "RCPT-1578",
        particulars: "Receipt via Cheque",
        debit: 20000,
        credit: 0,
      },
    ],
  },
];
