# 🏛 Lok Sabha Data Merger — MyNeta × Sansad × Empowered Indian

This Python project merges **MyNeta Lok Sabha 2024 winners’ data**, **Sansad.in Member API data**, and **Empowered Indian MPLADS utilization stats** into one enriched dataset.  
It produces a comprehensive CSV and HTML-ready descriptions for each Member of Parliament (MP) — including education, assets, and social profiles.

---

## ⚙️ Features

- 🔍 Scrapes **MyNeta.info** candidate details (Lok Sabha 2024)
- 🏛 Fetches **Sansad.in** member info & portfolio assignments
- 📊 Integrates **Empowered Indian** MPLADS utilization API
- 🧾 Generates **HTML MP descriptions** (ready for embedding)
- 🧠 Cleans & standardizes education, assets, and constituency names
- 🖼 Downloads MP photos into a local folder
- 💾 Produces two CSV outputs:
  - `combined_myneta_sansad.csv` → full dataset  
  - `gems_of_india.csv` → curated dataset for upload. Use upload-with-submit.py

---

## 🧰 Requirements

- Python 3.9+
- Google Chrome browser
- ChromeDriver installed and in PATH
- Internet connection (for scraping and API access)

### Install Dependencies

```bash
pip install selenium beautifulsoup4 pandas requests
```

---

## 🚀 Usage

### 1️⃣ Clone this repository

```bash
git clone https://github.com/yourusername/loksabha-merger.git
cd loksabha-merger
```

### 2️⃣ Run the script

```bash
python3 scrapeLoksabhaMPs.py
```

The script will:
- Open Chrome (headless)
- Scrape **MyNeta** winners list
- Pull **Sansad.in** MPs (18th Lok Sabha)
- Merge with **Empowered Indian** utilization data
- Save outputs locally

---

## 📂 Output Files

| File | Description |
|------|--------------|
| `combined_myneta_sansad.csv` | Full merged dataset with MyNeta, Sansad, and Empowered Indian columns |
| `gems_of_india.csv` | Curated dataset for external publishing |
| `mp_photos_sansad/` | Folder containing downloaded MP photos |

---

## 🧩 Column Prefixes

| Prefix | Source | Example Fields |
|--------|---------|----------------|
| `myneta_*` | MyNeta.info | Candidate, Party, Assets, Liabilities, Education |
| `sansad_*` | Sansad.in | Member ID, Photo, Address, DOB, Email |
| `empowered_*` | Empowered Indian | MP ID, Utilization %, Constituency |

---

## 🧠 Data Normalization

- **Constituencies** standardized between MyNeta & Sansad  
- **Emails** cleaned (fixes `[at]`, `(dot)` issues)  
- **Assets/Liabilities** parsed into crores  
- **Twitter/X links** prefixed automatically  
- **Photo URLs** sanitized and stored locally  

---

## 🏛 Council of Ministers Integration

Pulls the official list of ministers from  
[`https://sansad.in/ls/members/in-council-of-ministers`](https://sansad.in/ls/members/in-council-of-ministers)  
and enriches MP records with portfolio details such as *Minister of State for Education* or *Cabinet Minister for Finance*.

---

## 🔗 Empowered Indian Integration

Fetches utilization data from  
[`https://api.empoweredindian.in/api/summary/mps`](https://api.empoweredindian.in/api/summary/mps)  
for Lok Sabha term 18.


## 🧾 Example Output Row

| Column | Example |
|--------|----------|
| `myneta_candidate` | Rahul Gandhi |
| `myneta_total_assets` | ₹20.55 crore |
| `sansad_constituency` | Wayanad |
| `sansad_email` | rahulgandhi@nic.in |
| `sansad_position` | Member, Committee on Defence |
| `empowered_indian_url` | https://empoweredindian.in/mp/1234 |

---



## 🪶 Credits

**Data Sources:**
- [MyNeta.info](https://www.myneta.info/)
- [Sansad.in](https://sansad.in/)
- [Empowered Indian](https://empoweredindian.in)
