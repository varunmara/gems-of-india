#!/usr/bin/env python3
"""
Merge MyNeta LokSabha winners data with Sansad API data by constituency.
- MyNeta scraping: Selenium + BeautifulSoup
- Sansad scraping: requests to sansad.in API
Outputs merged CSV with prefixed columns: myneta_* and sansad_*
"""

import os
import time
import re
import json
import pandas as pd
import csv
import requests
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from bs4 import BeautifulSoup

# -----------------------
# CONFIG
# -----------------------
STATE = ""
PAGE_SIZE = 10
MYNETA_URL = "https://www.myneta.info/LokSabha2024/index.php?action=show_winners&sort=default"

# Sansad API endpoints
SANSAD_API_BASE = "https://sansad.in/api_ls/member"
SANSAD_DETAIL = "https://sansad.in/api_ls/member/{}?locale=en"
SANSAD_PROFILE_TEMPLATE = "https://sansad.in/ls/members/biographyM/{}?from=members"
SANSAD_MINISTERS_URL = "https://sansad.in/ls/members/in-council-of-ministers"

# Output
OUTPUT_CSV = "combined_myneta_sansad.csv"
OUTPUT2_CSV = "gems_of_india.csv"
PHOTO_DIR_SANSAD = "mp_photos_sansad"
os.makedirs(PHOTO_DIR_SANSAD, exist_ok=True)

# Selenium options
SELENIUM_HEADLESS = True

# -----------------------
# UTILITIES
# -----------------------
def parse_indian_money(value):
    """
    Parse Indian money strings like:
    'Rs 65,67,12,498~ 65 Crore+' → 656712498.0
    'Rs 42,09,587~ 42 Lacs+' → 4209587.0
    Nil -> 0
    """
    if not value:
        return 0.0

    if value=="Nil":
        return 0.0

    # Remove the tilde and any text that follows (e.g. "~ 65 Crore+")
    cleaned = re.sub(r"~.*", "", value)

    # Extract digits after the 'Rs' marker
    match = re.search(r"Rs[\s\u00A0]*([\d,]+)", cleaned)
    if not match:
        return 0.0

    # Normalize number format by removing commas
    num_str = match.group(1).replace(",", "")
    return float(num_str) if num_str.isdigit() else 0.0

def rupees_to_crores(value_in_rupees):
    """
    Convert a float rupee value into crores (rounded to 2 decimal places).
    Example:
        656712498 -> 6.57
        4209587   -> 0.42
    """
    if not value_in_rupees or not isinstance(value_in_rupees, (int, float)):
        return 0.0

    # 1 crore = 10,000,000 rupees
    value_in_crores = value_in_rupees / 1e7
    return round(value_in_crores, 2)

def norm_constituency(name):
    """
    Normalize constituency names, detect bye-election cases,
    and map known variants to standardized names.

    Returns:
        (cleaned_name, bye_election_prefix)
    """
    if not name:
        return "", ""

    # Remove parenthetical content
    s = re.sub(r"\([^)]*\)", "", name).strip()

    # Detect and strip ': BYE ELECTION...' suffix
    bye_election_prefix = ""
    if re.search(r":\s*BYE\s*ELECTION", s, re.IGNORECASE):
        bye_election_prefix = "BYE ELECTION"
        s = re.split(r":", s, 1)[0].strip()
    s = s.replace("&", "and")

    # Normalize spacing and uppercase
    s = re.sub(r"\s+", " ", s).strip().upper()

    # Known constituency name mappings
    # These constituncies names are not directly matching with sansad constitunecies. so mapping them sansad constituency names.
    constituency_map = {
        "BURDWAN - DURGAPUR": "Bardhaman-Durgapur",
        "ANANTHAPUR": "Anantapur",
        "COOCH BEHAR": "Coochbehar",
        "THIRUPATHI": "Tirupati",
        "NARSARAOPET": "Narasaraopet",
        "HARIDWAR": "Hardwar",
        "HATKANANGALE": "Hatkanangle",
        "NAINITAL-UDHAM SINGH NAGAR": "Nainital-Udhamsingh Nagar",
        "BHANDARA GONDIYA": "Bhandara-Gondiya",
        "DARRANG-UDALGURI": "Darrang Udalguri",
        "GADCHIROLI - CHIMUR": "Gadchiroli-Chimur",
        "MUMBAI NORTH - CENTRAL": "Mumbai North Central",
        "MUMBAI NORTH - EAST": "Mumbai North East",
        "MUMBAI NORTH - WEST": "Mumbai North West",
        "MUMBAI SOUTH - CENTRAL": "Mumbai South Central",
        "RATNAGIRI - SINDHUDURG": "RATNAGIRI-SINDHUDURG",
        "YAVATMAL - WASHIM": "YAVATMAL-WASHIM",
        "DADAR AND NAGAR HAVELI": "Dadra and Nagar Haveli"
    }

    # Apply mapping if found
    if s in constituency_map:
        s = constituency_map[s]
    return s.upper()

def clean_email_field(raw_email):
    """Convert obfuscated email formats into normal emails"""
    if not raw_email:
        return ""
    if isinstance(raw_email, list):
        raw_email = ", ".join(raw_email)
    cleaned = raw_email
    cleaned = cleaned.replace("[at]", "@").replace("[dot]", ".")
    cleaned = cleaned.replace("(at)", "@").replace("(dot)", ".")
    cleaned = cleaned.replace("{at}", "@").replace("{dot}", ".")
    cleaned = cleaned.replace("\n", " ").strip()
    cleaned = re.sub(r"\s*,\s*", ", ", cleaned)
    cleaned = re.sub(r"\s*@\s*", "@", cleaned)
    cleaned = re.sub(r"\s*\.\s*", ".", cleaned)
    cleaned = cleaned.strip(", ")
    return cleaned

def download_photo(photo_url, name, dest_dir):
    """Download photo and return local filename (empty on failure)"""
    if not photo_url:
        return ""
    filename = re.sub(r"[^\w\-\.]", "_", name)[:120] + ".jpg"
    path = os.path.join(dest_dir, filename)
    try:
        r = requests.get(photo_url, timeout=10)
        r.raise_for_status()
        with open(path, "wb") as fh:
            fh.write(r.content)
        return filename
    except Exception as e:
        print(f"⚠️ Could not download photo for {name}: {e}")
        return ""
# -----------------------
# COUNCIL OF MINISTERS SCRAPER
# -----------------------
def fetch_council_of_ministers(driver):
    """Fetch council of ministers JSON and return dict of mpsno -> position (only LS)."""
    driver.get(SANSAD_MINISTERS_URL)
    time.sleep(2)
    soup = BeautifulSoup(driver.page_source, "html.parser")
    script_tag = soup.find("script", id="__NEXT_DATA__", type="application/json")
    if not script_tag:
        print("⚠️ Could not find ministers JSON script tag.")
        return {}

    try:
        data = json.loads(script_tag.string)
        council_list = data["props"]["pageProps"]["councilMinister"]
    except Exception as e:
        print(f"⚠️ Error parsing ministers JSON: {e}")
        return {}

    ministers = {}
    for m in council_list:
        if m.get("house") != "LS":
            continue
        ministers[m["mpsno"]] = {
            "name": m.get("fullName"),
            "position": m.get("position"),
            "photoUrl": m.get("photoUrl")
        }

    print(f"🏛️ Loaded {len(ministers)} LS ministers")
    return ministers

def get_current_position(mp_code: int) -> str:
    """
    Fetches the latest position held by an MP from the Sansad API.

    Args:
        mp_code (int): The MP's unique code (mpsno) from sansad.in.

    Returns:
        str: The first entry's 'positionHeld' value, or an empty string if unavailable.
    """
    url = f"https://sansad.in/api_ls/member/positionHeld?mpCode={mp_code}&locale=en"

    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        data = response.json()

        if isinstance(data, list) and len(data) > 0:
            # Return the most recent (first) positionHeld entry
            position = data[0].get("positionHeld", "").strip()
            return position
        else:
            return ""
    except requests.RequestException as e:
        print(f"Error fetching position for mpCode {mp_code}: {e}")
        return ""
    except ValueError:
        print(f"Invalid JSON for mpCode {mp_code}")
        return ""

# -----------------------
# SANSAD SCRAPER
# -----------------------
def fetch_sansad_for_state(state, page_size=10, ministers_map=None):
    """Return list of sansad records for the given state using sansad API (all pages)."""
    records = []
    page = 1
    while True:
        params = {
            "loksabha": "18",
            "page": page,
            "size": page_size,
            "sitting": "1",
            "locale": "en",
            "memberStatus": "s"
        }
        resp = requests.get(SANSAD_API_BASE, params=params, timeout=15)
        resp.raise_for_status()
        data = resp.json()
        members = data.get("membersDtoList", [])
        if not members:
            break
        for m in members:
            member_id = m.get("mpsno")
            party = m.get("partyFname", "").strip()
            gender = m.get("gender", "").strip()
            constituency = m.get("constName", "").strip()
            state_name = m.get("stateName", "").strip()
            raw_email = m.get("email", "")
            email = clean_email_field(raw_email)
            photo_url = m.get("imageUrl", "").strip()
            loksabha_expr = m.get("lsExpr", "").strip()
            profile_url = SANSAD_PROFILE_TEMPLATE.format(member_id)

            # fetch details (optional)
            details = {}
            try:
                r = requests.get(SANSAD_DETAIL.format(member_id), timeout=10)
                if r.status_code == 200:
                    details = r.json()
            except Exception as e:
                print(f"⚠️ Failed to fetch Sansad details for {member_id}: {e}")

            name = details.get("firstLastName", "")
            dob = details.get("dateOfBirth", "")
            education = details.get("education", "") or ""
            education = education.replace("<br>", " ")
            present_addr = (details.get("presentFaddr", "") + " " + details.get("presentLaddr", "")).strip()
            permanent_addr = (details.get("permanentFaddr", "") + " " + details.get("permanentLaddr", "")).strip()
            facebook = details.get("facebook", "")
            twitter = details.get("twitter", "").lower()
            instagram = details.get("instagram", "")
            linkedin = details.get("linkedIn", "")
            if twitter and not re.match(r'^(https?:\/\/)?(www\.)?(x|twitter)\.com\/', twitter, re.IGNORECASE):
                twitter = "https://x.com/" + twitter


            sansad_rec = {
                "sansad_id": member_id,
                "sansad_name": name,
                "sansad_profile_url": profile_url,
                "sansad_constituency_raw": constituency,
                "sansad_constituency": norm_constituency(constituency),
                "sansad_party": party,
                "sansad_gender": gender,
                "sansad_state": state_name,
                "sansad_email": email,
                "sansad_dob": dob,
                "sansad_education": education,
                "sansad_present_address": present_addr,
                "sansad_permanent_address": permanent_addr,
                "sansad_facebook": facebook,
                "sansad_twitter": twitter,
                "sansad_instagram": instagram,
                "sansad_linkedin": linkedin,
                "sansad_photo_url": photo_url,
                "sansad_loksabha_terms": loksabha_expr,
                "sansad_position": "",
                "sansad_position_detail": ""
            }
            # Enrich with minister info
            if ministers_map and member_id in ministers_map:
                sansad_rec["sansad_position"] = ministers_map[member_id]["position"]
                sansad_rec["sansad_position_detail"] = get_current_position(member_id)
            sansad_rec["sansad_photo_file"] = download_photo(photo_url, name, PHOTO_DIR_SANSAD) if photo_url else ""
            records.append(sansad_rec)
            print(f"Sansad: {name} ({constituency})")
            time.sleep(0.2)

        total_pages = data.get("metaDatasDto", {}).get("totalPages", 1)
        if page >= total_pages:
            break
        page += 1

    print(f"📥 Fetched {len(records)} Sansad records for {state}")
    return records

# -----------------------
# MYNETA SCRAPER
# -----------------------
def setup_selenium(headless=True):
    opts = Options()
    if headless:
        opts.add_argument("--headless=new")
    driver = webdriver.Chrome(options=opts)
    return driver

def looks_like_valid_compare_row(cols_texts):
    """Filter out junk rows such as 'Donate now', 'Download app', 'Follow us', etc."""
    if not cols_texts:
        return False

    joined = " ".join([c.strip().upper() for c in cols_texts])
    junk_tokens = [
        "DONATE",
        "DONATE NOW",
        "DOWNLOAD",
        "FOLLOW US",
        "SHARE ON",
        "DOWNLOAD APP",
        "CLICK HERE",
        "ADVERTISEMENT",
    ]

    for token in junk_tokens:
        if token in joined:
            return False

    if not re.search(r"\d", joined):
        return False
    if len(cols_texts) < 3:
        return False

    return True

def get_myneta_profile_details(driver, profile_url):
    """Open a MyNeta profile page and extract photo, education, assets, liabilities, past elections, and state."""
    driver.get(profile_url)
    time.sleep(1.5)
    psoup = BeautifulSoup(driver.page_source, "html.parser")

    # --- State Name (find link with prefix /LokSabha2024/index.php?action=show_constituencies&state_id=) ---
    state = ""
    state_link = psoup.find("a", href=re.compile(r"^/LokSabha2024/index\.php\?action=show_constituencies&state_id=\d+"))
    if state_link:
        state = state_link.get_text(strip=True).upper()

    # --- Photo ---
    photo_url = ""
    photo_div = psoup.select_one("div.w3-third img")
    if photo_div:
        src = photo_div.get("src", "")
        if src.startswith("http"):
            photo_url = src
        elif src.startswith("/"):
            photo_url = "https://www.myneta.info" + src
        else:
            photo_url = "https://www.myneta.info/LokSabha2024/" + src

    # --- Education ---
    education_detail = ""
    edu_label = psoup.find(text=re.compile(r"Education", re.I))
    if edu_label:
        parent_td = edu_label.find_parent("td")
        if parent_td and parent_td.find_next_sibling("td"):
            education_detail = parent_td.find_next_sibling("td").get_text(" ", strip=True)

    # --- Assets & Liabilities ---
    assets = ""
    liabilities = ""

    assets_label = psoup.find(text=re.compile(r"Assets\s*:", re.I))
    if assets_label:
        parent_td = assets_label.find_parent("td")
        if parent_td and parent_td.find_next_sibling("td"):
            assets = parent_td.find_next_sibling("td").get_text(" ", strip=True)

    liabilities_label = psoup.find(text=re.compile(r"Liabilities\s*:", re.I))
    if liabilities_label:
        parent_td = liabilities_label.find_parent("td")
        if parent_td and parent_td.find_next_sibling("td"):
            liabilities = parent_td.find_next_sibling("td").get_text(" ", strip=True)

    # --- Other Elections (from 'Click here for more details') ---
    other_elections = []
    more_link = psoup.find("a", string=re.compile("Click here for more details", re.I))
    if more_link and more_link.get("href"):
        compare_url = more_link["href"]
        if compare_url.startswith("/"):
            compare_url = "https://www.myneta.info" + compare_url
        elif not compare_url.startswith("http"):
            compare_url = "https://www.myneta.info/LokSabha2024/" + compare_url

        driver.get(compare_url)
        time.sleep(1.5)
        csoup = BeautifulSoup(driver.page_source, "html.parser")

        target_table = None
        for tbl in csoup.find_all("table"):
            th_texts = " ".join([th.get_text(" ", strip=True).upper() for th in tbl.find_all("th")])
            if any(keyword in th_texts for keyword in ["DECLARATION", "ASSETS", "DECLARED"]):
                target_table = tbl
                break
        if not target_table:
            tables = csoup.find_all("table")
            if tables:
                target_table = max(tables, key=lambda t: len(t.find_all("tr")))

        if target_table:
            for tr in target_table.find_all("tr")[1:]:
                cols = tr.find_all("td")
                cols_texts = [c.get_text(" ", strip=True) for c in cols]
                if not looks_like_valid_compare_row(cols_texts):
                    continue
                if len(cols_texts) >= 8:
                    entry = {
                        "Election Name": cols_texts[0],
                        "Constituency": norm_constituency(cols_texts[1]),
                        "Party Code": cols_texts[3],
                        "Criminal Cases": cols_texts[4],
                        "Number of Cases": cols_texts[5],
                        "Education Level": cols_texts[6],
                        "Total Assets": cols_texts[7],
                        "Total Liabilities": cols_texts[8],
                    }
                    other_elections.append(entry)

    return photo_url, education_detail, other_elections, assets, liabilities, state

def scrape_empoweredindian():
    base_url = "https://api.empoweredindian.in/api/summary/mps"
    params = {
        "page": 1,
        "limit": 570,  # increase for faster pagination
        "search": "",
        "sortBy": "utilizationPercentage",
        "order": "desc",
        "house": "Lok Sabha",
        "ls_term": 18
    }

    constituency_to_mp_id = {}
    count=0;
    while True:
        response = requests.get(base_url, params=params)
        response.raise_for_status()
        data = response.json()

        if not data.get("success"):
            break

        for mp in data.get("data", []):
            constituency = mp.get("constituency").upper()
            constituency_key = constituency+":"+mp.get("state").upper()
            mp_id = mp.get("id")
            count+=1
            if constituency_key and mp_id:
                constituency_to_mp_id[constituency_key] = mp_id
        pagination = data.get("pagination", {})
        current_page = pagination.get("currentPage", 1)
        total_pages = pagination.get("totalPages", 1)

        print(f"Fetched page {current_page}/{total_pages}")

        if current_page >= total_pages:
            break

        params["page"] += 1

    print(f"\n✅ Found  {len(constituency_to_mp_id)} empowered indian constituencies iteration count: {count}")
    return constituency_to_mp_id

def scrape_myneta_all(driver):
    """Scrape MyNeta winners table. Returns list of myneta records."""
    driver.get(MYNETA_URL)
    time.sleep(4)
    soup = BeautifulSoup(driver.page_source, "html.parser")
    rows = soup.select("table tr")

    myneta_records = []
    for tr in rows[1:]:
        tds = tr.find_all("td")
        if len(tds) < 8:
            continue

        candidate_td = tds[1]
        candidate_name = candidate_td.get_text(strip=True)
        profile_url = ""
        a_tags = candidate_td.find_all("a")
        if len(a_tags) >= 2:
            href = a_tags[1].get("href", "")
            if href.startswith("/"):
                profile_url = "https://www.myneta.info" + href
            else:
                profile_url = "https://www.myneta.info/LokSabha2024/" + href

        constituency_raw = tds[2].get_text(strip=True)
        constituency = norm_constituency(constituency_raw)
        party = tds[3].get_text(strip=True)
        criminal_case = tds[4].get_text(strip=True)
        education_summary = tds[5].get_text(strip=True)
        total_assets = tds[6].get_text(strip=True)
        liabilities = tds[7].get_text(strip=True)

        photo_url = ""
        education_detail = ""
        other_elections = []
        state=""

        if profile_url:
            try:
                photo_url, education_detail, other_elections, total_assets, liabilities, state= get_myneta_profile_details(driver, profile_url)
            except Exception as e:
                print(f"⚠️ Error fetching myneta profile {candidate_name}: {e}")

        rec = {
            "myneta_candidate": candidate_name,
            "myneta_profile_url": profile_url,
            "myneta_constituency_raw": constituency_raw,
            "myneta_constituency": constituency,
            "myneta_party": party,
            "myneta_criminal_cases": criminal_case,
            "myneta_education_summary": education_summary,
            "myneta_education_detail": education_detail,
            "myneta_total_assets": total_assets,
            "myneta_liabilities": liabilities,
            "myneta_other_elections": json.dumps(other_elections, ensure_ascii=False),
            "myneta_photo_url": photo_url,
            "myneta_constituency_key": constituency.strip().upper()+":"+state.strip().upper()
        }
        myneta_records.append(rec)
        print(f"MyNeta: {candidate_name} ({constituency_raw})")

    print(f"📥 Scraped {len(myneta_records)} MyNeta records")
    return myneta_records

# -----------------------
# MERGE LOGIC
# -----------------------
def build_sansad_lookup(sansad_records):
    d = {}
    for r in sansad_records:
        key = r.get("sansad_constituency", "")+":"+r.get("sansad_state", "").upper()
        d.setdefault(key, []).append(r)
    print(d)
    return d

def find_sansad_by_constituency(myneta_const, sansad_lookup):
    """Exact match only"""
    if myneta_const in sansad_lookup:
        return sansad_lookup[myneta_const][0]
    return None

def generate_candidate_description(row):
    """
    Generate a detailed politician profile description in clean HTML format
    based on merged Sansad and MyNeta data.
    """

    html = ""

    # --- 1. Position Detail ---
    position_detail = (
        f" is {row['sansad_position_detail']} and "
        if pd.notna(row.get("sansad_position_detail")) and str(row["sansad_position_detail"]).strip()
        else ""
    )

    # --- 2. Introduction ---
    html += (
        f"<strong>{row['sansad_name']}</strong> (born {row['sansad_dob']}) "
        f"{position_detail}is an Indian politician from "
        f"<strong>{row['sansad_party']}</strong> representing "
        f"<strong>{row['sansad_constituency_raw']}</strong> Lok Sabha constituency of "
        f"<strong>{row['sansad_state']}</strong> in the <strong>18th Lok Sabha</strong>.<br><br>"
    )

    # --- 3. Addresses ---
    if pd.notna(row.get("sansad_present_address")) and str(row["sansad_present_address"]).strip():
        html += f"<strong>Present Address:</strong><br>{row['sansad_present_address']}<br><br>"
    if pd.notna(row.get("sansad_permanent_address")) and str(row["sansad_permanent_address"]).strip():
        html += f"<strong>Permanent Address:</strong><br>{row['sansad_permanent_address']}<br><br>"

    # --- 4. Education ---
    if pd.notna(row.get("sansad_education_summary")) or pd.notna(row.get("sansad_education")):
        html += "<strong>🎓 Education Details:</strong><br>"
        if pd.notna(row.get("sansad_education_summary")):
            html += f"- Level: {row['sansad_education_summary']}<br>"
        if pd.notna(row.get("sansad_education")):
            html += f"- {row['sansad_education']}<br><br>"

    # --- 5. Election Declarations (only if non-empty and valid JSON) ---
    elections_data = str(row.get("myneta_other_elections", "")).strip()
    if elections_data and elections_data not in ["[]", "null", "None"]:
        try:
            elections = json.loads(elections_data)
            if isinstance(elections, list) and len(elections) > 0:
                html += "<strong>🗳️ Election Declarations:</strong><br>"
                html += (
                    '<table border="1" cellspacing="0" cellpadding="5">'
                    "<thead><tr>"
                    "<th>Election Year</th><th>Party Code</th><th>Constituency</th><th>Criminal Cases</th><th>No of Criminal Cases</th>"
                    "<th>Total Assets</th><th>Total Liabilities</th>"
                    "</tr></thead><tbody>"
                )
                for e in elections:
                    html += (
                        "<tr>"
                        f"<td>{e.get('Election Name', '')}</td>"
                        f"<td>{e.get('Party Code', '')}</td>"
                        f"<td>{e.get('Constituency', '')}</td>"
                        f"<td>{e.get('Criminal Cases', '')}</td>"
                        f"<td>{e.get('Number of Cases', '')}</td>"
                        f"<td>{e.get('Total Assets', '')}</td>"
                        f"<td>{e.get('Total Liabilities', '')}</td>"
                        "</tr>"
                    )
                html += "</tbody></table><br>"
        except Exception as ex:
            html += f"(Error parsing election data: {ex})<br><br>"

    # --- 6. Lok Sabha Terms ---
    if pd.notna(row.get("sansad_loksabha_terms")):
        html += "<strong>📜 Lok Sabha Terms:</strong><br>"
        try:
            terms = [t.strip() for t in str(row["sansad_loksabha_terms"]).split(",") if t.strip()]
            for t in terms:
                if t.isdigit():
                    t = int(t)
                    start_year = 2024 - (18 - t) * 5
                    end_year = "current" if t == 18 else start_year + 5
                    html += f"- {t}th Lok Sabha ({start_year} to {end_year})<br>"
            html += "<br>"
        except Exception as ex:
            html += f"(Error parsing terms: {ex})<br><br>"

    # --- 7. Profile Links ---
    sansad_link = row.get("sansad_profile_url", "")
    myneta_link = row.get("myneta_profile_url", "")
    empowered_indian_link = row.get("empowered_indian_url","")
    if sansad_link:
        html += (
            f"<strong>Sansad Profile:</strong> "
            f'<a href="{sansad_link}" target="_blank">View on Sansad.in</a><br>'
        )
    if myneta_link:
        html += (
            f"<strong>MyNeta Profile:</strong> "
            f'<a href="{myneta_link}" target="_blank">View on MyNeta.info</a>'
        )
    if empowered_indian_link:
        html += (
            f"<strong>Empowered Indian MPLADS Dashboard:</strong> "
            f'<a href="{empowered_indian_link}" target="_blank">View on Empowered Indian</a>'
        )

    return html.strip()


# -----------------------
# MAIN
# -----------------------
def main():
    driver_local = setup_selenium(headless=SELENIUM_HEADLESS)
    try:
        # Load ministers first
        ministers_map = fetch_council_of_ministers(driver_local)
        myneta_data = scrape_myneta_all(driver_local)
        sansad_data = fetch_sansad_for_state(STATE, page_size=PAGE_SIZE, ministers_map=ministers_map)

        sansad_lookup = build_sansad_lookup(sansad_data)
        constituency_key_to_mpid = scrape_empoweredindian()
        merged = []
        finalRows = []
        match_count = 0

        for m in myneta_data:
            key = m.get("myneta_constituency_key", "")
            sansad_rec = find_sansad_by_constituency(key, sansad_lookup)
            combined = dict(m)
            if sansad_rec:
                match_count += 1
                for k, v in sansad_rec.items():
                    if k not in combined:
                        combined[k] = v
                    else:
                        combined["sansad_" + k] = v
                merged.append(combined)
            else:
                print("sansad profile  not found for ")
                print(m)
            if key in constituency_key_to_mpid.keys():
                combined['empowered_indian_url']="https://www.empoweredindian.in/mplads/mps/"+constituency_key_to_mpid[key]
            else:
                combined['empowered_indian_url']=""
                print(f"constituency: {key} not found in empowered indian")

        for row in merged:
            newRow = {}
            newRow['city'] = row['sansad_constituency_raw']
            newRow['state'] = row['sansad_state']
            newRow['name'] = row['sansad_name']
            newRow['title'] = row['sansad_position_detail'] if row['sansad_position_detail'] else  "Member of Parliament, "+row['sansad_constituency_raw']+", "+row['sansad_state']
            newRow['description'] = generate_candidate_description(row)
            newRow['email'] = row['sansad_email']
            newRow['twitter'] = row['sansad_twitter']
            newRow['facebook'] = row['sansad_facebook']
            newRow['sansad_id'] = row['sansad_id']
            newRow['myneta_profile_url'] = row['myneta_profile_url']
            newRow['sansad_profile_url'] = row['sansad_profile_url']
            newRow['empowered_indian_url'] = row['empowered_indian_url']
            newRow['liabilities'] = row['myneta_liabilities']
            newRow['total_assets'] = row['myneta_total_assets']
            newRow['networth'] = rupees_to_crores(parse_indian_money(row['myneta_total_assets'])-parse_indian_money(row['myneta_liabilities']))
            newRow['photo_file'] = row['sansad_photo_file']
            newRow['party'] = row['sansad_party']
            newRow['keywords'] = [row['sansad_party'], row['sansad_state']+" politics", row['sansad_constituency_raw']]
            finalRows.append(newRow)

        print(f"\n🔍 Matches found: {match_count}/{len(myneta_data)}")
        all_keys = set()
        for r in merged:
            all_keys.update(r.keys())
        fieldnames = sorted(all_keys)

        fieldnamesKeys = sorted(finalRows[0].keys())

        with open(OUTPUT_CSV, "w", newline="", encoding="utf-8") as fh:
            writer = csv.DictWriter(fh, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(merged)

        with open(OUTPUT2_CSV, "w", newline="", encoding="utf-8") as fh:
            writer = csv.DictWriter(fh, fieldnames=fieldnamesKeys)
            writer.writeheader()
            writer.writerows(finalRows)

        print(f"✅ Raw CSV written to {OUTPUT_CSV} ({len(merged)} rows)")

        print(f"✅ Gems of India CSV written to {OUTPUT2_CSV} ({len(finalRows)} rows)")
    finally:
        driver_local.quit()

if __name__ == "__main__":
    main()
