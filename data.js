// ====================================================================
// CRAFTFLOW: RATE APPROVAL SUMMARY & PRODUCTION MASTER DATA
// For The Period Of 11-SEP-2026 TO 25-SEP-2026 (Hand Embroidery)
// 53 Exact Styles from Rate Approval Sheet (Image 1 & 2)
// ====================================================================

const INITIAL_CONTRACTORS = [
  { id: 8, name: "Imtiaz", phone: "0347022819", status: "Active" },
  { id: 9, name: "Asif", phone: "03122385341", status: "Active" },
  { id: 10, name: "Shoaib", phone: "03132356230", status: "Active" },
  { id: 11, name: "Touseef", phone: "03228399197", status: "Active" },
  { id: 12, name: "Asim", phone: "03190039428", status: "Active" },
  { id: 13, name: "Naveed", phone: "03122232112", status: "Active" }
];

const INITIAL_CONTRACTOR_COMBINATIONS = [
  "IMT/ASIM",
  "IMT/ASIF/ASIM",
  "IMT/TOUS",
  "IMT/ASIF",
  "NAV/ASIF",
  "ASIF/SHO",
  "TOU/SHO/NAV",
  "TOUS/SHO",
  "TOUS/ASIF",
  "ASIF/NAVI",
  "ASIF/ASIM",
  "ASIF/NAW",
  "ASIF/NAV",
  "NAV/ASIM",
  "SHO/TOUS",
  "TOU/SHO",
  "NAV/ASIF/ASIM/IMT"
];

const INITIAL_SAMPLE_STYLES_RAW = [];
const INITIAL_RATE_APPROVAL_DATA = [];
const INITIAL_MASTER_INVENTORY = [];
const INITIAL_FINAL_STYLES = [];

// ====================================================================
// WORK DISTRIBUTION MASTER DATA: 6 CONTRACTORS BI-MONTHLY CYCLES
// Exactly matching the Distribution Sheet (26-Sep-2026 TO 10-Oct-2026)
// ====================================================================

const INITIAL_DISTRIBUTION_PERIODS = [
  {
    id: "dist_period_26sep_10oct_2026",
    period_name: "26-Sep-2026 TO 10-Oct-2026",
    start_date: "2026-09-26",
    end_date: "2026-10-10",
    department: "Hand Embroidery Department",
    status: "Active",
    notes: "Contractor Work Distribution - Cycle 1"
  },
  {
    id: "dist_period_11oct_25oct_2026",
    period_name: "11-Oct-2026 TO 25-Oct-2026",
    start_date: "2026-10-11",
    end_date: "2026-10-25",
    department: "Hand Embroidery Department",
    status: "Active",
    notes: "Contractor Work Distribution - Cycle 2"
  }
];

const INITIAL_WORK_DISTRIBUTION = [
  { id: 1, sr_no: 1, period: "26-Sep-2026 TO 10-Oct-2026", style_code: "JLS-27-010", contractor_name: "IMT/ASIM", pcs_qty: 830, rate: 182, item: "SHIRT", floor: "3B", total_amount: 151060 },
  { id: 2, sr_no: 2, period: "26-Sep-2026 TO 10-Oct-2026", style_code: "JPS-IEX-26-3914", contractor_name: "IMT/ASIF/ASIM", pcs_qty: 46, rate: 1408, item: "SHIRT", floor: "3B", total_amount: 64768 },
  { id: 3, sr_no: 3, period: "26-Sep-2026 TO 10-Oct-2026", style_code: "JLS-27-067", contractor_name: "IMTIAZ", pcs_qty: 1760, rate: 57, item: "SHIRT", floor: "", total_amount: 100320 },
  { id: 4, sr_no: 4, period: "26-Sep-2026 TO 10-Oct-2026", style_code: "JDS-27-1024", contractor_name: "IMTIAZ", pcs_qty: 1590, rate: 116, item: "SHIRT", floor: "", total_amount: 184440 },
  { id: 5, sr_no: 5, period: "26-Sep-2026 TO 10-Oct-2026", style_code: "JPS-IEX-26-3954", contractor_name: "IMTIAZ", pcs_qty: 140, rate: 581, item: "SHIRT", floor: "2", total_amount: 81340 },
  { id: 6, sr_no: 6, period: "26-Sep-2026 TO 10-Oct-2026", style_code: "JLS-27-066", contractor_name: "ASIM", pcs_qty: 1760, rate: 69, item: "SHIRT", floor: "5", total_amount: 121440 },
  { id: 7, sr_no: 7, period: "26-Sep-2026 TO 10-Oct-2026", style_code: "JLS-27-010", contractor_name: "IMT/ASIM", pcs_qty: 830, rate: 182, item: "SHIRT", floor: "3B", total_amount: 151060 },
  { id: 8, sr_no: 8, period: "26-Sep-2026 TO 10-Oct-2026", style_code: "JPS-IEX-26-3914", contractor_name: "IMT/ASIF/ASIM", pcs_qty: 46, rate: 1408, item: "SHIRT", floor: "3B", total_amount: 64768 },
  { id: 9, sr_no: 9, period: "26-Sep-2026 TO 10-Oct-2026", style_code: "JLS-27-086", contractor_name: "ASIM", pcs_qty: 1783, rate: 88, item: "SHIRT", floor: "", total_amount: 156904 },
  { id: 10, sr_no: 10, period: "26-Sep-2026 TO 10-Oct-2026", style_code: "JPS-26-4113", contractor_name: "ASIM", pcs_qty: 775, rate: 104, item: "SHIRT", floor: "4", total_amount: 80600 },
  { id: 11, sr_no: 11, period: "26-Sep-2026 TO 10-Oct-2026", style_code: "JST-27-2002", contractor_name: "ASIF", pcs_qty: 1691, rate: 62, item: "SHIRT", floor: "5", total_amount: 104842 },
  { id: 12, sr_no: 12, period: "26-Sep-2026 TO 10-Oct-2026", style_code: "JLS-26-857", contractor_name: "ASIF", pcs_qty: 781, rate: 62, item: "SHIRT", floor: "5", total_amount: 48422 },
  { id: 13, sr_no: 13, period: "26-Sep-2026 TO 10-Oct-2026", style_code: "JPS-IEX-26-3914", contractor_name: "IMT/ASIF/ASIM", pcs_qty: 46, rate: 1408, item: "SHIRT", floor: "3B", total_amount: 64768 },
  { id: 14, sr_no: 14, period: "26-Sep-2026 TO 10-Oct-2026", style_code: "JLS-27-012", contractor_name: "NAV/ASIF", pcs_qty: 890, rate: 127, item: "SHIRT", floor: "", total_amount: 113030 },
  { id: 15, sr_no: 15, period: "26-Sep-2026 TO 10-Oct-2026", style_code: "JLS-26-873", contractor_name: "ASIF", pcs_qty: 661, rate: 184, item: "SHIRT", floor: "4", total_amount: 121624 },
  { id: 16, sr_no: 16, period: "26-Sep-2026 TO 10-Oct-2026", style_code: "JLS-27-085", contractor_name: "ASIF/SHO", pcs_qty: 891, rate: 139, item: "SHIRT", floor: "", total_amount: 123849 },
  { id: 17, sr_no: 17, period: "26-Sep-2026 TO 10-Oct-2026", style_code: "JGP-26-1745", contractor_name: "NAVEED", pcs_qty: 1840, rate: 57, item: "SHIRT", floor: "5", total_amount: 104880 },
  { id: 18, sr_no: 18, period: "26-Sep-2026 TO 10-Oct-2026", style_code: "JLS-27-012", contractor_name: "NAV/ASIF", pcs_qty: 890, rate: 127, item: "SHIRT", floor: "", total_amount: 113030 },
  { id: 19, sr_no: 19, period: "26-Sep-2026 TO 10-Oct-2026", style_code: "JLS-26-846", contractor_name: "NAVEED", pcs_qty: 937, rate: 63, item: "SHIRT", floor: "2", total_amount: 59031 },
  { id: 20, sr_no: 20, period: "26-Sep-2026 TO 10-Oct-2026", style_code: "JPS-IEX-26-3912", contractor_name: "TOU/SHO/NAV", pcs_qty: 46, rate: 1347, item: "SHIRT", floor: "3", total_amount: 61962 },
  { id: 21, sr_no: 21, period: "26-Sep-2026 TO 10-Oct-2026", style_code: "JLS-27-089", contractor_name: "NAVEED", pcs_qty: 1780, rate: 99, item: "SHIRT", floor: "", total_amount: 176220 },
  { id: 22, sr_no: 22, period: "26-Sep-2026 TO 10-Oct-2026", style_code: "JLS-26-065", contractor_name: "NAVEED", pcs_qty: 1760, rate: 41, item: "SHIRT", floor: "", total_amount: 72160 },
  { id: 23, sr_no: 23, period: "26-Sep-2026 TO 10-Oct-2026", style_code: "JLS-27-090", contractor_name: "TOUSEEF", pcs_qty: 1776, rate: 77, item: "SHIRT", floor: "", total_amount: 136752 },
  { id: 24, sr_no: 24, period: "26-Sep-2026 TO 10-Oct-2026", style_code: "JLS-27-087", contractor_name: "TOUS/SHO", pcs_qty: 890, rate: 132, item: "SHIRT", floor: "", total_amount: 117480 },
  { id: 25, sr_no: 25, period: "26-Sep-2026 TO 10-Oct-2026", style_code: "JLS-26-859", contractor_name: "TOUS/SHO", pcs_qty: 590, rate: 252, item: "SHIRT", floor: "4", total_amount: 148680 },
  { id: 26, sr_no: 26, period: "26-Sep-2026 TO 10-Oct-2026", style_code: "JPS-IEX-26-3912", contractor_name: "TOU/SHO/NAV", pcs_qty: 46, rate: 1347, item: "SHIRT", floor: "3", total_amount: 61962 },
  { id: 27, sr_no: 27, period: "26-Sep-2026 TO 10-Oct-2026", style_code: "JLS-27-011", contractor_name: "TOUSEEF", pcs_qty: 1666, rate: 59, item: "SHIRT", floor: "", total_amount: 98294 },
  { id: 28, sr_no: 28, period: "26-Sep-2026 TO 10-Oct-2026", style_code: "JDS-27-1022", contractor_name: "SHOAIB", pcs_qty: 1590, rate: 84, item: "SHIRT", floor: "", total_amount: 133560 },
  { id: 29, sr_no: 29, period: "26-Sep-2026 TO 10-Oct-2026", style_code: "JLS-27-087", contractor_name: "TOUS/SHO", pcs_qty: 890, rate: 132, item: "SHIRT", floor: "", total_amount: 117480 },
  { id: 30, sr_no: 30, period: "26-Sep-2026 TO 10-Oct-2026", style_code: "JLS-26-859", contractor_name: "TOUS/SHO", pcs_qty: 590, rate: 252, item: "SHIRT", floor: "4", total_amount: 148680 },
  { id: 31, sr_no: 31, period: "26-Sep-2026 TO 10-Oct-2026", style_code: "JPS-IEX-26-3912", contractor_name: "TOU/SHO/NAV", pcs_qty: 46, rate: 1347, item: "SHIRT", floor: "3", total_amount: 61962 },
  { id: 32, sr_no: 32, period: "26-Sep-2026 TO 10-Oct-2026", style_code: "JLS-27-085", contractor_name: "ASIF/SHO", pcs_qty: 891, rate: 139, item: "SHIRT", floor: "", total_amount: 123849 }
];

