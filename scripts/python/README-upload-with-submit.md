# Gems of India Entity Uploader

This Python script automates the process of uploading images and creating entities on [**gemsofindia.org**](https://gemsofindia.org).  
It uploads Person photos via the UploadThing API and submits entity details (including Twitter and Facebook URLs) automatically.  

---

## Setup Instructions

### 1. Requirements

- **Python 3.8+**
- Install dependencies:
  ```bash
  pip install requests
  ```

### 2. Authentication Cookies (Important)

You must provide valid cookies from your logged-in Gems of India session.

**Steps to get cookies:**

1. Log in to [https://gemsofindia.org](https://gemsofindia.org).
2. Go to the **Submit Gem** page and upload any image.
3. Open **Developer Tools → Network** tab.
4. Find the request:
   ```
   https://gemsofindia.org/api/uploadthing?actionType=upload&slug=entityLogo
   ```
5. Right-click the request → **Copy → Copy as cURL**.
6. Paste into a text editor and locate the line:
   ```
   cookie: _ga=...; __Secure-better-auth.state=...; __Secure-better-auth.session_token=...; _ga_YN24PVX1PK=...
   ```
7. Copy these values into the script’s `COOKIES` section:

   ```python
   COOKIES = {
       "_ga": "YOUR_VALUE",
       "__Secure-better-auth.state": "YOUR_VALUE",
       "__Secure-better-auth.session_token": "YOUR_VALUE",
       "_ga_YN24PVX1PK": "YOUR_VALUE",
   }
   ```

> **Note:** Cookies expire every few days. Refresh them whenever you see “Unauthorized” errors.

---

## Input CSV Format

The input file (default: `test-file.csv`) must have the following headers:

| name | description | city | state | email | title | networth | keywords | twitter | facebook | photo_file |
|------|--------------|------|-------|--------|--------|-----------|-----------|----------|-----------|
| Example Name | Member of Parliament | Ongole | Andhra Pradesh | mp@email.com | MP | 0 | governance,development | https://x.com/example | https://facebook.com/example | example.jpg |

The corresponding image must exist at:

```
./mps/mp_photos_sansad/example.jpg
```

---

## How to Run

```bash
python upload_entities.py
```

The script will:

1. Read entity details from the CSV.
2. Upload the photo to UploadThing.
3. Submit the entity with metadata (Twitter, Facebook, etc.).
4. Write results to `upload_results.csv`.
5. Remove successfully processed rows from the input CSV.

---

## Output Files

### ✅ `upload_results.csv`
Contains details of all successfully uploaded entities.

| name | uploaded_key | entity_id | slug | twitter | facebook |
|------|---------------|-----------|------|----------|-----------|

### 📝 `test-file.csv`
Automatically updated to keep only unprocessed rows.

---

## Common Issues

| Error | Cause | Fix |
|-------|--------|-----|
| `Unauthorized` | Expired cookies | Re-copy cookies |
