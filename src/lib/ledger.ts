import dayjs from "dayjs";
import { ledgerParties, type LedgerEntry, type LedgerParty } from "@/data/ledgerData";

const FINANCIAL_YEAR_START_MONTH = 4; // April
const FINANCIAL_YEAR_START_DAY = 1;

export type LedgerStatement = {
  party: LedgerParty;
  entries: (LedgerEntry & { balance: number })[];
  openingBalance: number;
  closingBalance: number;
  fromDate: string;
  toDate: string;
};

export const getFinancialYearStart = (referenceDate = dayjs()) => {
  const fiscalYearStartYear =
    referenceDate.month() + 1 >= FINANCIAL_YEAR_START_MONTH
      ? referenceDate.year()
      : referenceDate.year() - 1;

  return dayjs(`${fiscalYearStartYear}-${FINANCIAL_YEAR_START_MONTH}-${FINANCIAL_YEAR_START_DAY}`);
};

export const findParty = (partyId: string) => ledgerParties.find((party) => party.id === partyId);

export const buildLedgerStatement = (
  partyId: string,
  fromDate = getFinancialYearStart(),
  toDate = dayjs()
): LedgerStatement => {
  const party = findParty(partyId);
  if (!party) {
    throw new Error("Party not found");
  }

  const sortedEntries = [...party.entries].sort((a, b) => dayjs(a.date).diff(dayjs(b.date)));

  const from = dayjs(fromDate);
  const to = dayjs(toDate);

  const openingBalance = sortedEntries
    .filter((entry) => dayjs(entry.date).isBefore(from, "day"))
    .reduce((acc, entry) => acc + entry.credit - entry.debit, 0);

  let runningBalance = openingBalance;

  const filteredEntries = sortedEntries.filter((entry) => {
    const entryDate = dayjs(entry.date);
    return entryDate.isSame(from, "day") || entryDate.isAfter(from)
      ? entryDate.isSame(to, "day") || entryDate.isBefore(to)
      : false;
  });

  const entriesWithBalance = filteredEntries.map((entry) => {
    runningBalance += entry.credit - entry.debit;
    return {
      ...entry,
      balance: runningBalance,
    };
  });

  return {
    party,
    entries: entriesWithBalance,
    openingBalance,
    closingBalance: runningBalance,
    fromDate: from.format("YYYY-MM-DD"),
    toDate: to.format("YYYY-MM-DD"),
  };
};
