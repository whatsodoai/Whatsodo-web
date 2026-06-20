import * as XLSX from 'xlsx';
import { KnowledgeBase } from '@/types';

type KbDraft = Partial<KnowledgeBase>;

const SHEET = {
  company: 'Company Info',
  services: 'Services',
  faqs: 'FAQs',
  sales: 'Sales Config',
  objections: 'Objections',
} as const;

/** Downloads a .xlsx template with one sheet per knowledge base tab, pre-filled with the current data. */
export function downloadKbTemplate(kb: KbDraft, fileName = 'whatsodo-knowledge-base.xlsx') {
  const wb = XLSX.utils.book_new();

  const companySheet = XLSX.utils.aoa_to_sheet([
    ['Field', 'Value'],
    ['Company Name', kb.companyName || ''],
    ['Company Description', kb.companyDescription || ''],
    ['AI Tone', kb.tone || 'Professional'],
    ['Contact Email', kb.contactEmail || ''],
    ['Contact Phone', kb.contactPhone || ''],
  ]);
  XLSX.utils.book_append_sheet(wb, companySheet, SHEET.company);

  const services = kb.services?.length ? kb.services : [''];
  const offers = kb.offers?.length ? kb.offers : [''];
  const servicesRows = Math.max(services.length, offers.length);
  const servicesSheet = XLSX.utils.aoa_to_sheet([
    ['Service', 'Offer'],
    ...Array.from({ length: servicesRows }, (_, i) => [services[i] || '', offers[i] || '']),
  ]);
  XLSX.utils.book_append_sheet(wb, servicesSheet, SHEET.services);

  const faqs = kb.faqs?.length ? kb.faqs : [{ question: '', answer: '' }];
  const faqsSheet = XLSX.utils.aoa_to_sheet([
    ['Question', 'Answer'],
    ...faqs.map((f) => [f.question, f.answer]),
  ]);
  XLSX.utils.book_append_sheet(wb, faqsSheet, SHEET.faqs);

  const leadQs = kb.leadQualificationQuestions?.length ? kb.leadQualificationQuestions : [''];
  const ctas = kb.callToActions?.length ? kb.callToActions : [''];
  const salesRows = Math.max(leadQs.length, ctas.length);
  const salesSheet = XLSX.utils.aoa_to_sheet([
    ['Sales Instructions', 'Appointment Instructions', 'Lead Qualification Questions', 'Call To Actions'],
    [kb.salesInstructions || '', kb.appointmentInstructions || '', leadQs[0] || '', ctas[0] || ''],
    ...Array.from({ length: salesRows - 1 }, (_, i) => ['', '', leadQs[i + 1] || '', ctas[i + 1] || '']),
  ]);
  XLSX.utils.book_append_sheet(wb, salesSheet, SHEET.sales);

  const objections = kb.objectionHandling?.length ? kb.objectionHandling : [{ objection: '', response: '' }];
  const objectionsSheet = XLSX.utils.aoa_to_sheet([
    ['Objection', 'Response'],
    ...objections.map((o) => [o.objection, o.response]),
  ]);
  XLSX.utils.book_append_sheet(wb, objectionsSheet, SHEET.objections);

  XLSX.writeFile(wb, fileName);
}

function sheetRows(wb: XLSX.WorkBook, name: string): string[][] {
  const sheet = wb.Sheets[name];
  if (!sheet) return [];
  return XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: '', blankrows: false });
}

function cell(v: unknown): string {
  return v === undefined || v === null ? '' : String(v).trim();
}

/** Parses a .xlsx file (one sheet per tab) into a partial KnowledgeBase. Throws if no recognized sheet is found. */
export async function parseKbWorkbook(file: File): Promise<KbDraft> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array' });

  const recognized = Object.values(SHEET).some((name) => wb.SheetNames.includes(name));
  if (!recognized) {
    throw new Error(
      `No recognized sheet found. Expected sheet names: ${Object.values(SHEET).join(', ')}`
    );
  }

  const kb: KbDraft = {};

  const companyRows = sheetRows(wb, SHEET.company).slice(1);
  const fieldMap: Record<string, keyof KbDraft> = {
    'company name': 'companyName',
    'company description': 'companyDescription',
    'ai tone': 'tone',
    'contact email': 'contactEmail',
    'contact phone': 'contactPhone',
  };
  for (const row of companyRows) {
    const key = fieldMap[cell(row[0]).toLowerCase()];
    if (key) (kb as Record<string, unknown>)[key] = cell(row[1]);
  }

  const servicesRows = sheetRows(wb, SHEET.services).slice(1);
  const services = servicesRows.map((r) => cell(r[0])).filter(Boolean);
  const offers = servicesRows.map((r) => cell(r[1])).filter(Boolean);
  if (servicesRows.length) {
    kb.services = services;
    kb.offers = offers;
  }

  const faqRows = sheetRows(wb, SHEET.faqs).slice(1);
  const faqs = faqRows
    .map((r) => ({ question: cell(r[0]), answer: cell(r[1]) }))
    .filter((f) => f.question || f.answer);
  if (faqRows.length) kb.faqs = faqs;

  const salesRows = sheetRows(wb, SHEET.sales).slice(1);
  if (salesRows.length) {
    kb.salesInstructions = cell(salesRows[0]?.[0]);
    kb.appointmentInstructions = cell(salesRows[0]?.[1]);
    kb.leadQualificationQuestions = salesRows.map((r) => cell(r[2])).filter(Boolean);
    kb.callToActions = salesRows.map((r) => cell(r[3])).filter(Boolean);
  }

  const objectionRows = sheetRows(wb, SHEET.objections).slice(1);
  const objectionHandling = objectionRows
    .map((r) => ({ objection: cell(r[0]), response: cell(r[1]) }))
    .filter((o) => o.objection || o.response);
  if (objectionRows.length) kb.objectionHandling = objectionHandling;

  return kb;
}
