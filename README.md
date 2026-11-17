# CraftFlow - Hand Embroidery Department Production & Inventory SaaS

A modern, high-performance web software application designed for the **Hand Embroidery Department** in garment & apparel manufacturing.

This application directly digitizes and automates the workflows from your Excel workbooks:
1. **Master Inventory (Image 1)**: Complete tracking of receiving cut pieces, logging challans, dispatching finished embroidery, and tracking balances with contractors.
2. **Daily Final Style Status Report (Image 2)**: Select any **Style Code** and **Category**, and the system **instantly auto-fetches** Contractor Name, Cut Quantity, Received Quantity, Balance from Stock, and Balance in H-Emb (WIP), allowing quick daily floor remarks and status updates.
3. **Neon PostgreSQL Cloud Sync**: Direct serverless database connection with offline-first local persistence.

---

## 🚀 Quick Start & 1-Click Desktop / Mobile Launch

### Option 1: 1-Click Desktop App (Recommended)
1. Double-click [`Start-CraftFlow.bat`](file:///d:/Hamza/Hanad-Emb-System-main/Start-CraftFlow.bat) or [`CraftFlow.vbs`](file:///d:/Hamza/Hanad-Emb-System-main/CraftFlow.vbs).
2. It automatically starts the high-speed background server (port 3000) and launches CraftFlow directly in a clean Google Chrome standalone App window!
3. To put a shortcut on your Desktop: Right-click [`Create-Desktop-Shortcut.ps1`](file:///d:/Hamza/Hanad-Emb-System-main/Create-Desktop-Shortcut.ps1) -> **Run with PowerShell**.

### Option 2: Mobile Chrome Access
- **Local Wi-Fi Access**: Connect your mobile phone to the same Wi-Fi as your PC, then open `http://<YOUR-PC-IP>:3000` in Mobile Chrome and tap **"Add to Home Screen"** or **"Install App"**.
- *(Note: Never type `127.0.0.1` on mobile, because `127.0.0.1` refers to the mobile phone itself, not your PC!)*
- **Cloud / Vercel (24/7 Anywhere Access)**: Deploy to Vercel (free, `vercel.json` already configured). Once on HTTPS, Mobile Chrome will show a 1-tap "Install App" prompt that creates a real native-like Android WebAPK app with full offline cache and Neon Cloud database sync!

---

## 🌟 Key Features

### 1. Executive Operations Dashboard & Real-Time Floor Control
- **Hero Welcome & Status Center**: Dynamic operational greeting, active date, department badge, and one-click quick action buttons (New Style, Inward Challan, Outward Challan, Daily Sheet, Live Refresh).
- **Primary 6 KPI Command Cards**: Real-time aggregation of Total Cut Demand, Received in H-Emb (% of cut), Dispatched to Unit (fulfillment %), Floor WIP on Adda, Pending Delivery from Cutting (Stock), and Active Contractors Engaged. Clicking any card instantly jumps to its detailed module.
- **Visual Production Lifecycle Funnel**: Multi-segmented progress bar visually dividing overall volume into Dispatched (Done), Floor WIP (Adda), and Pending Stock (Cutting).
- **Contractor WIP & Workload Distribution**: Live cards displaying pending pieces, active style count, and relative % share of total factory WIP per contractor.
- **Floor Remarks & Bottleneck Alerts**: Highlights styles with critical floor remarks (`MATERIAL NOT AVAILABLE`, `ALTER`, `MATERIAL ISSUE`) and top WIP styles needing management focus.
- **Category & Garment Breakdown**: Volume and completion tracking per garment type (Shirt, Dupatta, Gala, Trouser, Sleeve).
- **Recent Activity Stream**: Filterable timeline of the latest 8 inward receiving and outward dispatch challans.

### 2. Master Inventory & Challan Management (Exact to Image 1)
- **Columns**: SR, Style Code, Ship (e.g., CPC), Category (Shirt, Dupatta, etc.), Cut Qty.
- **Receiving Section**: Received Qty, Balance from Stock (`Cut - Received`), Date Receive, Challan Rec.
- **Dispatch Section**: Dispatch from H-Emb, Balance from H-Emb (`Received - Dispatch`), Total Balance (`Cut - Dispatch`), Date Dispatch, Challan Dis, Contractor Name.
- **Excel-Accurate Visual Highlighting**: Non-zero balances automatically display with a soft pink/red background just like Excel.
- **New Entry Modal**: Features real-time calculation preview as you type quantities.
- **Filters & Search**: Instantly search by Style Code, Contractor, Challan number, or filter by Contractor and Balance status.
- **Export**: One-click export to CSV / Excel.

### 2. Daily Final Style Running Sheet (Exact to Image 2 - Auto-Fetch)
- **Instant Auto-Fetch**:
  - In the **Daily Final Style Sheet** tab, simply choose a `Style Code` and `Category`.
  - The software **automatically fetches** Contractor Name, Cut Qty, Received Qty, Balance from Stock, and Balance from H-Emb!
- **Auto-Add Active Styles**:
  - One-click button to automatically add all styles currently active on the embroidery floor with pending balances!
- **Floor Remarks & Status**:
  - Direct inline editing of remarks with quick preset buttons: `MATERIAL NOT AVAILABLE`, `MATERIAL ISSUE`, `Inline`, `ALTER`, or custom dates.
- **Contractor Workload Sidebar**:
  - Shows real-time summary of how many pending pieces are sitting with each contractor (e.g. Touseef, Asif, Shoaib, Naveed, Imtiaz, etc.).
- **Print / PDF Report**:
  - Styled for official paper printing or PDF export with clean black-and-white borders, official title header, and sheet date.

### 3. Contractor Hub & Directory
- View workload distribution per contractor.
- Track total pieces assigned, completed, and pending.
- Add new embroidery contractors.

### 4. Neon PostgreSQL Database Integration
- **Serverless PostgreSQL**:
  - Direct connection to Neon PostgreSQL (`https://console.neon.tech`).
  - Configure connection string or HTTP SQL endpoint in the **Neon PostgreSQL** tab.
  - "Test Neon Connection" with live ping.
  - "Push Local Data to Neon Cloud" & "Pull Cloud Data from Neon".
  - "Initialize Neon Tables" executes the database DDL automatically.
- **Offline-First Architecture**:
  - Uses browser `localStorage` as primary zero-latency cache.
  - Zero downtime even if internet disconnects.

---

## 🗄️ PostgreSQL Database Schema (`schema.sql`)

The database schema is provided in [`schema.sql`](file:///c:/Users/amir.ghouri/Desktop/Hand%20Emb%20System/schema.sql):
- `contractors`: id, name, phone, rate_per_piece, status
- `master_inventory`: sr_no, style_code, ship, category, cut_qty, received_qty, balance_from_stock, date_receive, challan_rec, dispatch_from_hemb, balance_from_hemb, total_balance, date_dispatch, challan_dis, contractor_name, status, remarks
- `final_style_report`: report_date, serial_no, style_code, category, contractor_name, cut_qty, received_qty, balance_from_stock, balance_from_hemb, time_remarks
- `v_contractor_summary`: View summarizing pending balances per contractor.

You can also copy the SQL directly from the software UI under **Neon PostgreSQL -> View PostgreSQL Schema**.

---

## 💻 Tech Stack
- **HTML5**: Clean semantic SaaS architecture
- **CSS3 / Vanilla**: Modern dark/light design system with Inter & JetBrains Mono typography, glassmorphism, responsive grid, and `@media print` rules
- **JavaScript (ES6+)**: Zero-dependency modular controllers
- **Storage**: Browser LocalStorage + Neon Serverless PostgreSQL HTTP API
