import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { z } from "zod";
import nodemailer from "nodemailer";
import PDFDocument from "pdfkit";
import dayjs from "dayjs";

import { buildLedgerStatement } from "@/lib/ledger";
import { findParty } from "@/lib/ledger";
import { DEFAULT_EMAIL_BODY, DEFAULT_EMAIL_SUBJECT } from "@/constants/emailDefaults";

const requestSchema = z.object({
  partyId: z.string().min(1, "Party is required"),
  email: z.string().email("Invalid email address"),
  subject: z.string().min(1),
  body: z.string().min(1),
});

const createTransporter = () => {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_SECURE, SMTP_FROM_EMAIL } =
    process.env;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_FROM_EMAIL) {
    throw new Error("SMTP configuration is incomplete. Please set the required environment variables.");
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: SMTP_SECURE === "true",
    auth:
      SMTP_USER && SMTP_PASSWORD
        ? {
            user: SMTP_USER,
            pass: SMTP_PASSWORD,
          }
        : undefined,
  });
};

const createLedgerPdf = async ({ partyId }: { partyId: string }) => {
  const statement = buildLedgerStatement(partyId);
  const companyName = process.env.COMPANY_NAME ?? "Your Company Name";

  return await new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const buffers: Buffer[] = [];

    doc.on("data", (chunk) => buffers.push(Buffer.from(chunk)));
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.on("error", reject);

    doc.fontSize(18).text(companyName, { align: "center" });
    doc.moveDown();
    doc.fontSize(14).text("Ledger Statement", { align: "center" });
    doc.moveDown();

    doc.fontSize(10);
    doc.text(`Party: ${statement.party.name}`);
    if (statement.party.gstin) {
      doc.text(`GSTIN: ${statement.party.gstin}`);
    }
    if (statement.party.address) {
      doc.text(`Address: ${statement.party.address}`);
    }
    doc.text(
      `Date Range: ${dayjs(statement.fromDate).format("DD MMM YYYY")} - ${dayjs(statement.toDate).format("DD MMM YYYY")}`
    );
    doc.moveDown();

    const tableColumnWidths: [number, number, number, number, number] = [80, 150, 130, 80, 80];

    const drawTableHeader = () => {
      doc.font("Helvetica-Bold");
      doc.text("Date", doc.x, doc.y, { width: tableColumnWidths[0] });
      doc.text("Reference", doc.x + tableColumnWidths[0], doc.y, { width: tableColumnWidths[1] });
      doc.text("Particulars", doc.x + tableColumnWidths[0] + tableColumnWidths[1], doc.y, {
        width: tableColumnWidths[2],
      });
      doc.text("Debit", doc.x + tableColumnWidths[0] + tableColumnWidths[1] + tableColumnWidths[2], doc.y, {
        width: tableColumnWidths[3],
        align: "right",
      });
      doc.text(
        "Credit",
        doc.x + tableColumnWidths[0] + tableColumnWidths[1] + tableColumnWidths[2] + tableColumnWidths[3],
        doc.y,
        { width: tableColumnWidths[4], align: "right" }
      );
      doc.moveDown(0.5);
      doc.font("Helvetica");
    };

    drawTableHeader();

    statement.entries.forEach((entry, index) => {
      if (index > 0 && index % 25 === 0) {
        doc.addPage();
        drawTableHeader();
      }

      doc.text(dayjs(entry.date).format("DD MMM YYYY"), doc.x, doc.y, { width: tableColumnWidths[0] });
      doc.text(entry.reference, doc.x + tableColumnWidths[0], doc.y, { width: tableColumnWidths[1] });
      doc.text(entry.particulars, doc.x + tableColumnWidths[0] + tableColumnWidths[1], doc.y, {
        width: tableColumnWidths[2],
      });
      doc.text(entry.debit ? entry.debit.toFixed(2) : "-", doc.x + tableColumnWidths[0] + tableColumnWidths[1] + tableColumnWidths[2], doc.y, {
        width: tableColumnWidths[3],
        align: "right",
      });
      doc.text(
        entry.credit ? entry.credit.toFixed(2) : "-",
        doc.x + tableColumnWidths[0] + tableColumnWidths[1] + tableColumnWidths[2] + tableColumnWidths[3],
        doc.y,
        { width: tableColumnWidths[4], align: "right" }
      );
      doc.moveDown();
    });

    doc.moveDown();
    doc.font("Helvetica-Bold").text(`Closing Balance: ${statement.closingBalance.toFixed(2)}`);

    doc.end();
  });
};

const persistLedgerPdf = async (fileName: string, buffer: Buffer) => {
  const configuredOutput = process.env.LEDGER_OUTPUT_DIR;
  const intendedWindowsPath = path.join("E:", "Tally Test", "Tally PDF");
  const fallbackPath = path.join(process.cwd(), "storage", "Tally PDF");

  const outputDirectory =
    configuredOutput && configuredOutput.trim().length > 0
      ? configuredOutput
      : process.platform === "win32"
        ? intendedWindowsPath
        : fallbackPath;

  try {
    await fs.mkdir(outputDirectory, { recursive: true });
    const filePath = path.join(outputDirectory, fileName);
    await fs.writeFile(filePath, buffer);
    return filePath;
  } catch (error) {
    console.warn("Unable to persist ledger PDF locally:", error);
    return null;
  }
};

export async function POST(request: Request) {
  try {
    const parsed = requestSchema.parse(await request.json());

    const party = findParty(parsed.partyId);
    if (!party) {
      return NextResponse.json({ error: "Party not found" }, { status: 404 });
    }

    const transporter = createTransporter();

    const ledgerPdf = await createLedgerPdf({ partyId: party.id });
    const pdfFileName = `Ledger_${party.name.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;

    const savedPath = await persistLedgerPdf(pdfFileName, ledgerPdf);

    const textBody = parsed.body;
    const htmlBody = parsed.body.replace(/\n/g, "<br />");

    await transporter.sendMail({
      from: process.env.SMTP_FROM_EMAIL,
      to: parsed.email,
      subject: parsed.subject || DEFAULT_EMAIL_SUBJECT,
      text: textBody || DEFAULT_EMAIL_BODY,
      html: htmlBody || DEFAULT_EMAIL_BODY.replace(/\n/g, "<br />"),
      attachments: [
        {
          filename: pdfFileName,
          content: ledgerPdf,
        },
      ],
    });

    return NextResponse.json({
      message: "Email sent successfully with Ledger attachment!",
      savedPath,
    });
  } catch (error) {
    console.error(error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to send email" },
      { status: 500 }
    );
  }
}
