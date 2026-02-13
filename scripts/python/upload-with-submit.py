import csv
import json
import os
import requests
import ast
from mimetypes import guess_type

CSV_FILE = "test-file.csv"
PHOTO_DIR = "./mps/mp_photos_sansad"
UPLOAD_INIT_URL = "https://gemsofindia.org/api/uploadthing?actionType=upload&slug=entityLogo"
SUBMIT_URL = "https://gemsofindia.org/submit"
OUTPUT_FILE = "upload_results.csv"

COOKIES = {
    "_ga": "",
    "__Secure-better-auth.state": "",
    "__Secure-better-auth.session_token": "",
    "_ga_YN24PVX1PK": "",
}

COMMON_HEADERS = {
    "Accept": "*/*",
    "Accept-Language": "en-US,en;q=0.9,te;q=0.8",
    "Connection": "keep-alive",
    "Origin": "https://gemsofindia.org",
    "Referer": "https://gemsofindia.org/submit",
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                  "AppleWebKit/537.36 (KHTML, like Gecko) "
                  "Chrome/140.0.0.0 Safari/537.36",
    "b3": "217e9319951056140f2d9af334d5103e-1f34105969888b91-01",
    "content-type": "application/json",
    "sec-ch-ua": '"Chromium";v="140", "Not=A?Brand";v="24", "Google Chrome";v="140"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"macOS"',
    "traceparent": "00-217e9319951056140f2d9af334d5103e-1f34105969888b91-01",
    "x-uploadthing-package": "@uploadthing/react",
    "x-uploadthing-version": "7.7.4",
}


def init_upload(file_name, file_size, mime_type):
    """Step 1: Initialize upload session."""
    payload = {
        "files": [{
            "name": file_name,
            "size": file_size,
            "type": mime_type,
            "lastModified": 1762656056765
        }]
    }

    try:
        r = requests.post(UPLOAD_INIT_URL, headers=COMMON_HEADERS, cookies=COOKIES, json=payload)
        r.raise_for_status()
        data = r.json()
        print(f"✅ Init success for {file_name}")

        # UploadThing returns either a list or dict
        if isinstance(data, list):
            return data[0]["url"], data[0]["key"]
        elif "url" in data:
            return data["url"], data.get("key", "")
        else:
            raise ValueError(f"Unexpected response: {data}")
    except Exception as e:
        print(f"❌ Error initializing upload for {file_name}: {e}")
        if 'r' in locals():
            print("Response text:", r.text)
        raise


def upload_file(upload_url, photo_path, mime_type):
    """Step 2: Upload file using multipart/form-data."""
    with open(photo_path, "rb") as f:
        # Construct the multipart form-data exactly like the browser
        files = {
            "file": (os.path.basename(photo_path), f, mime_type)
        }

        headers = {
            "Accept": "*/*",
            "Origin": "https://gemsofindia.org",
            "Referer": "https://gemsofindia.org/submit",
            "User-Agent": "Mozilla/5.0",
            "x-uploadthing-version": "7.7.4",
        }

        try:
            r = requests.put(upload_url, files=files, headers=headers)
            r.raise_for_status()
            print(r.json())
            print(f"✅ Upload complete for {photo_path}")
            return {"status": "success", "url": r.json()['ufsUrl']}
        except Exception as e:
            print(f"❌ Upload failed for {photo_path}: {e}")
            print("Response text:", r.text if 'r' in locals() else "No response")
            raise

def submit_entity(row, uploaded_url):
    """Submit the entity with image key and social URLs."""
    payload = [{
        "name": row.get("name", ""),
        "description": row.get("description", ""),
        "websiteUrl": "",
        "logoUrl": uploaded_url,
        "imageUrl": None,
        "categories": ["central-government", "state-government"],
        "keywords": ast.literal_eval(row.get('keywords')),
        "parentEntities": [{
            "id": "be12e7d3-4f09-43cd-a387-5148aa9c6fb8",
            "name": "Government of India",
            "entityType": "organization"
        }],
        "streetAddress": "",
        "city": row.get("city"),
        "state": row.get("state"),
        "country": "India",
        "email": row.get("email", ""),
        "twitterUrl": row.get("twitter", ""),
        "facebookUrl": row.get("facebook", ""),
        "netWorth": row.get("networth", "0"),
        "entityType": "person",
        "jobTitle": row.get("title", ""),
        "jobResponsibilities": "Serve People!",
        "featuredOnHomepage": False,
        "dailyRanking": 0,
    }]

    headers = {
        "Accept": "text/x-component",
        "Accept-Encoding": "gzip, deflate, br, zstd",
        "Accept-Language": "en-US,en;q=0.9,te;q=0.8",
        "Connection": "keep-alive",
        "Content-Type": "text/plain;charset=UTF-8",
        "Origin": "https://gemsofindia.org",
        "Referer": "https://gemsofindia.org/submit",
        "Sec-Ch-Ua": '"Chromium";v="140", "Not=A?Brand";v="24", "Google Chrome";v="140"',
        "Sec-Ch-Ua-Mobile": "?0",
        "Sec-Ch-Ua-Platform": '"macOS"',
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                      "AppleWebKit/537.36 (KHTML, like Gecko) "
                      "Chrome/140.0.0.0 Safari/537.36",
        "Next-Action": "40c099e912187d2946439ebe43cc7e37e681f48caf",
        "Next-Router-State-Tree": "%5B%22%22%2C%7B%22children%22%3A%5B%22 (entities)%22%2C%7B%22children%22%3A%5B%22submit%22%2C%7B%22children%22%3A%5B%22_PAGE_%22%2C%7B%7D%2Cnull%2Cnull%5D%7D%2Cnull%2Cnull%5D%7D%2Cnull%2Cnull%5D%7D%2Cnull%2Cnull%2Ctrue%5D",
    }

    r = requests.post(SUBMIT_URL, headers=headers, cookies=COOKIES, json=payload)
    print(r.text)
    r.raise_for_status()

    # handle response lines like "0:{...} 1:{...}"
    text = r.text.strip()
    print(text)
    parts = text.split("\n")
    response_data = {}
    print(r)
    for p in parts:
        try:
            _, val = p.split(":", 1)
            obj = json.loads(val)
            response_data.update(obj)
        except Exception:
            continue
    return response_data


def remove_processed_row(all_rows, processed_row):
    """Remove successfully processed row from input list."""
    return [r for r in all_rows if r != processed_row]


def main():
    results = []
    with open(CSV_FILE, newline='', encoding='utf-8') as csvfile:
        reader = list(csv.DictReader(csvfile))

    remaining_rows = reader.copy()

    for row in reader:
        name = row.get("name", "")
        photo_name = row.get("photo_file", "")
        photo_path = os.path.join(PHOTO_DIR, photo_name)

        if not os.path.exists(photo_path):
            print(f"⚠️ Missing photo for {name}: {photo_name}")
            continue

        try:
            mime_type = guess_type(photo_path)[0] or "image/jpeg"
            file_size = os.path.getsize(photo_path)
            print(f"\n▶ Uploading {photo_name} ({file_size} bytes)...")

            upload_url, key = init_upload(photo_name, file_size, mime_type)
            uploadResponse = upload_file(upload_url, photo_path, mime_type)

            print(f"✅ Uploaded {photo_name}, key={key} url: {uploadResponse['url']}")

            submit_response = submit_entity(row, uploadResponse['url'])
            entity_id = submit_response.get("entityId", "")
            slug = submit_response.get("slug", "")

            print(f"✅ Submitted entity for {name}: {entity_id}, {slug}")

            results.append({
                **row,
                "uploaded_key": key,
                "entity_id": entity_id,
                "slug": slug
            })

            remaining_rows = remove_processed_row(remaining_rows, row)

        except Exception as e:
            print(f"❌ Error processing {name}: {e}")

    if results:
        with open(OUTPUT_FILE, "w", newline='', encoding='utf-8') as outcsv:
            fieldnames = list(results[0].keys())
            writer = csv.DictWriter(outcsv, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(results)
        print(f"\n📁 Upload summary written to {OUTPUT_FILE}")

    # rewrite remaining unprocessed rows back to input CSV
    with open(CSV_FILE, "w", newline='', encoding='utf-8') as csvfile:
        if remaining_rows:
            fieldnames = remaining_rows[0].keys()
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(remaining_rows)
            print(f"📝 Updated {CSV_FILE} with remaining {len(remaining_rows)} rows.")
        else:
            writer = csv.writer(csvfile)
            writer.writerow([])
            print("✅ All rows processed. Input file cleared.")


if __name__ == "__main__":
    main()
