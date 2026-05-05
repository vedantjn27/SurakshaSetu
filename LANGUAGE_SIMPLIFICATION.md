# SurakshaSetu Frontend - Language Simplification Guide

## Overview

All text in the SurakshaSetu frontend has been simplified to use easy, everyday language that anyone can understand. No technical jargon is used.

---

## Key Language Changes by Feature

### 1. **Authentication & Login**

#### Before (Technical):
- "Select Your Role"
- "Choose your access level"
- "Admin Role"
- "Reviewer Role"
- "Analyst Role"
- "Full system access including PII unscrambling"

#### After (Simple):
- "What Is Your Job?"
- "Choose your job type"
- "Manager"
- "Data Handler"
- "Viewer"
- "Can see everything and make changes"

**Why**: Users are not IT people - they're government officials. We use job titles they recognize (Manager, Data Handler) instead of technical roles.

---

### 2. **Dashboard & Main Features**

#### Before (Technical):
- "UBID Registry" → "All People"
- "Data Ingestion" → "Upload Data"
- "Review Center" → "Check Matches"
- "Audit Logs" → "Work History"
- "Privacy Playground" → "Tools"
- "Total UBIDs" → "Total People"
- "Active Records" → "Active People"

#### After (Simple):
- Uses simple, descriptive terms everyone understands
- Changed technical "UBID" to "People" or "Person"
- Menu names are action-based ("Upload Data", "Check Matches")

**Why**: Users don't need to know what "UBID" or "Audit Logs" mean. They care about what they can DO - upload data, check matches, see history.

---

### 3. **Data Upload Section**

#### Before (Technical):
- "Data Ingestion"
- "Upload Master Data"
- "Upload Event Data"
- "Rows Processed"

#### After (Simple):
- "Upload Data"
- "Upload People List"
- "Upload Activity"
- "Records Added"

**Why**: Uses familiar words. "People List" is clearer than "Master Data". "Activity" is clearer than "Event Data".

---

### 4. **Review & Matching**

#### Before (Technical):
- "Ambiguous Matches" → "Possible Duplicates"
- "Orphan Events" → "Unmatched Records"
- "Match Score" → "Similarity Score"
- "Escalate" → "Ask Manager"
- "Assign to UBID" → "Link to Person"

#### After (Simple):
- Users understand "duplicate" immediately
- "Unmatched records" is clearer than "orphan events"
- "Link to person" shows exactly what will happen

**Why**: Real-world terminology people use in daily conversations.

---

### 5. **Privacy & Security**

#### Before (Technical):
- "PII Scrambler"
- "Deterministically scramble sensitive data"
- "PII Unscrambler"
- "Reveal original data using secure vault"

#### After (Simple):
- "Hide Information"
- "Hide sensitive data in a safe way"
- "Show Original Data"
- "Show the original hidden data (Managers Only)"

**Why**: Even explains WHO can do it ("Managers Only") to prevent confusion.

---

### 6. **Profile & Details**

#### Before (Technical):
- "UBID Details" → "Person Details"
- "Linked Records" → "Connected Records"
- "Network Linkages" → "Connected People"
- "Override Status" → "Change Status"

#### After (Simple):
- Uses "Person" instead of technical "UBID"
- "Connected" is easier to understand than "Linkages"
- Action verbs are clear (Change, Update, Link)

---

### 7. **Common Actions**

#### Before (Technical):
- "Edit" → "Change"
- "Submit" → "Send"
- "Logout" → "Sign Out"
- "Error" → "Something went wrong"
- "Success" → "Done!"

#### After (Simple):
- Everyone knows what "Change" means
- "Send" is more friendly than "Submit"
- "Sign Out" is what Facebook/Gmail use
- Error messages explain what happened

**Why**: Uses terms from popular apps people already know.

---

### 8. **Branding & Marketing Page**

#### Before (Technical):
- "Enterprise Identity Verification & Fraud Detection Platform"
- "Unified Identity Registry"
- "Advanced Fraud Detection"
- "Real-time Analytics"

#### After (Simple):
- "A Smart System to Check and Protect People's Identities"
- "One Place for All Identities"
- "Find Duplicate & Fake Identities"
- "Live Reports & Information"

**Why**: Explains WHAT the system does in simple words, not what it IS technically.

---

## Translation Quality

All three languages (English, Hindi, Kannada) have been simplified with:

### Hindi (हिन्दी)
- Simple, everyday Hindi words
- No Sanskrit or complex Hindi technical terms
- Uses familiar job titles: "प्रबंधक" (Manager), "डेटा हैंडलर" (Data Handler)

### Kannada (ಕನ್ನಡ)
- Simple, everyday Kannada words
- Easy-to-understand action verbs
- Clear descriptions of what each button does

---

## Design Principle

**"Explain What, Not What's Technical"**

- Instead of: "Unscramble PII" → "Show Original Data"
- Instead of: "UBID" → "Person" or "People"
- Instead of: "Ambiguous Matches" → "Possible Duplicates"
- Instead of: "Network Graph" → "Connected People"

---

## User Experience Benefit

A new user can now:
1. Understand every button's purpose without training
2. Know what will happen when they click something
3. Understand error messages and what went wrong
4. Use the system in their preferred language (EN/HI/KN) with confidence

---

## Testing the Changes

When you open the app:
- No technical jargon on the login page
- Dashboard shows clear KPI labels
- Every button explains what it does
- Error messages are helpful, not confusing
- You can understand the system in simple words

All translations maintain accuracy while being easy to understand.

---

**Last Updated**: May 6, 2026
**Status**: All 3 languages simplified ✓
**Coverage**: 160+ UI strings per language
**Quality**: User-friendly, no technical jargon
