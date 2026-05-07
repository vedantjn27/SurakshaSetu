# SurakshaSetu Frontend Testing Guide

This guide provides step-by-step instructions to manually test all major features of the SurakshaSetu frontend. 

> [!IMPORTANT]
> **Pre-requisites:**
> 1. Ensure the Backend Server is running (`python -m uvicorn app.main:app --reload`).
> 2. Ensure the Frontend Server is running (`npm run dev`).
> 3. Ensure your database is seeded. If not, run `python scripts/seed_users.py` in the backend directory to create default users.

## 1. Authentication & Login
1. Navigate to `http://localhost:3000/login`.
2. Enter the Admin credentials:
   - **Username**: `admin`
   - **Password**: `admin123`
3. Click **Login**. You should be redirected to the Dashboard.

## 2. Data Upload (Ingestion)
1. Navigate to **Data Upload** from the sidebar (`/data-upload`).
2. **Test Master Data Upload**:
   - Select the **Upload Master** option.
   - Drag and drop or browse to select the `sample_shop_master.csv` file.
   - Click **Upload**.
   - Monitor the Job Progress section. It should show the job processing and completing.
3. **Test Events Data Upload**:
   - Select the **Upload Events** option.
   - Drag and drop or browse to select the `sample_events.csv` file.
   - Click **Upload**.
   - Monitor the Job Progress. It should successfully ingest the events.

## 3. Dashboard Analytics
1. Navigate to the **Dashboard** (`/dashboard`).
2. Verify that the **Total Entities**, **Pending Reviews**, and other top-level metrics have updated based on your uploads.
3. Scroll down to the **Suraksha AI Assistant** section.
4. Type a natural language query, for example: *"Show me active businesses in 560001"* or *"Summarize the recent events"*.
5. Verify that the AI provides an accurate, contextual response based on the ingested data.

## 4. UBID Registry
1. Navigate to the **UBID Registry** (`/ubid-registry`).
2. You should see a list of newly generated UBIDs (Universal Business IDs) from the master data.
3. Click **View Details** on any UBID to enter the details page.
4. **Test the Tabs**:
   - **Identities**: Verify the list of linked source identities (e.g., Shop & Establishment records).
   - **Network Graph**: Check the visual representation of connected entities sharing common PAN or Phone numbers.
   - **Audit Trail**: Review the timeline of changes (e.g., creation, linking).
5. **Admin Actions**: Try clicking **Override Status** to manually change the activity status, or **Split Identities** if multiple records were merged into one UBID.

## 5. Review Center
1. Navigate to the **Review Center** (`/review-center`).
2. **Pending Matches**: If any records scored below the auto-link threshold but above the review threshold, they will appear here. Test approving or rejecting a match.
3. **Orphaned Events**: Events from the `sample_events.csv` that didn't match any UBID will appear here (e.g., `SHOP003` which might not have a strong match).
   - Click **AI Suggest Match** to have the system recommend a UBID.
   - Try manually assigning it to a UBID.

## 6. Privacy Playground
1. Navigate to the **Privacy Playground** (`/privacy-playground`).
2. Select any of the records loaded.
3. Toggle the switch between **Scrambled (Public)** and **Unscrambled (Admin Only)**.
4. Verify that sensitive fields like `Phone`, `Email`, and `PAN` are successfully unscrambled. Since you are logged in as an Admin, you should have full access to view this.

## 7. Audit Logs
1. Navigate to **Audit Logs** (`/audit-logs`).
2. Review the chronologically ordered list of actions.
3. Verify that the actions you just performed (e.g., Uploading data, unscrambling data, overriding a UBID status) are properly logged with your `admin` username.

## 8. Internationalization (Localization)
1. Look for the **Language Selector** (usually in the header or sidebar).
2. Switch the language from **English** to **Hindi** or **Kannada**.
3. Verify that the UI elements and navigation labels update according to the selected language.

---
> [!NOTE]
> The sample files (`sample_shop_master.csv` and `sample_events.csv`) are located in the `test_data` folder in the root directory.
