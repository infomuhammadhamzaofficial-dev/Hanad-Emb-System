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
    id: "dist_period_11oct_25oct_2026",
    period_name: "11-Oct-2026 TO 25-Oct-2026",
    start_date: "2026-10-11",
    end_date: "2026-10-25",
    department: "Hand Embroidery Department",
    status: "Active",
    notes: "Contractor Work Distribution"
  }
];

const INITIAL_WORK_DISTRIBUTION = [];


