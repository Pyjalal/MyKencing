# MyKencing QA verification

Verified on 2026-10-01 using only `adb -s emulator-5558`. Installed package: `com.mykencing.app`, version 1.0.0 (versionCode 1), Android 15, 1080 × 2400. The installed release was exercised without rebuilding it. Source references below identify the workspace code inspected during this pass.

All eight exploration findings reproduced. Additional coverage found three app defects and one environment blocker. Screenshots and logs were captured independently for this verification; exploration screenshots were not reused. Only files inside `qa/vitals-chat-export/` were written.

### VIT-01: Profile name, age, and gender disappear when settings reload

- Verdict: CONFIRMED
- Severity: Medium
- Steps to reproduce: Reset the app, complete onboarding with age 45, male gender, weight 78 kg, and Be healthy, then accept consent. Open Vitals → View Health Profile and complete the required risk questionnaire, again entering male and age 45. Health Profile shows “Not recorded” for age and “Gender not set.” Open Update Inputs → age Edit, enter 45, and Save; Risk Assessment still shows “Age not set.” Separately, open Profile & Settings, enter “Test User,” tap Save, return to Home, and reopen Settings; the name field is blank.
- Root cause: `src/stores/settingsStore.ts:84` — `loadSettings` copies database rows only when their keys exist in the defaults object. `DEFAULT_SETTINGS` at line 39 omits `userName`, `userAge`, and `userGender`, so these stored fields are discarded from the loaded state. `updateSettings` invokes this loader at line 129. The name caller is `src/screens/SettingsScreen.tsx:41`; the age caller is `src/screens/RiskAssessmentScreen.tsx:166`.
- Suggested fix: Load all recognized AppSettings fields, including optional profile fields, using explicit defaults or a complete validated key list. Verify them after saving, reopening Settings, and restarting the app.
- Evidence: [verify-shots/16-health-profile.png](verify-shots/16-health-profile.png), [verify-shots/18-age-saved-missing.png](verify-shots/18-age-saved-missing.png), [verify-shots/20-name-saved.png](verify-shots/20-name-saved.png), [verify-shots/21-name-reopened.png](verify-shots/21-name-reopened.png).
- Refinement: This onboarding flow has no name input. The name must be entered in Settings. The failure occurs on loading the settings state; the evidence does not establish that the database rows themselves are deleted.

### VIT-02: Analytics omits glucose and weight from the vitals count

- Verdict: CONFIRMED
- Severity: Medium
- Steps to reproduce: From Home → Log today's vitals, complete all four steps with BP 120/80, weight 78 kg, height 175 cm, glucose 5.5 mmol/L, total cholesterol 5.0 mmol/L, and HDL 1.4 mmol/L. Generate three reports, selecting 30, 7, and 90 days, and return from the share/print flow each time. Open Settings → Attributions → Analytics. The 30-day dashboard shows “Vitals Logged: 3,” “Reports Generated: 3,” and “App Opens: 3.” The same vital count appears for 7 and 90 days.
- Root cause: `src/stores/vitalsStore.ts:168` and `src/stores/vitalsStore.ts:190` — glucose and weight actions reload readings without logging `EventType.VitalLogged`. BP logs the event at line 146; the cholesterol actions also log it. `src/screens/AnalyticsDashboardScreen.tsx:80` displays that event count rather than counting stored readings.
- Suggested fix: Emit one VitalLogged event after each successful glucose and weight insert, consistently with the other vital actions.
- Evidence: [verify-shots/33-analytics-counts.png](verify-shots/33-analytics-counts.png), [verify-shots/34-analytics-7.png](verify-shots/34-analytics-7.png), [verify-shots/35-analytics-90.png](verify-shots/35-analytics-90.png), [verify-shots/31-report-en-page1.png](verify-shots/31-report-en-page1.png), [verify-shots/26-five-vitals-saved.png](verify-shots/26-five-vitals-saved.png).
- Refinement: Total Events is 9 in this run, rather than the exploration run's 7, because this run logged three app opens. The expected total is 11: five vitals + three reports + three app opens. Both runs omit exactly two vital events.

### VIT-03: Malay export leaves the blood pressure heading and columns in English

- Verdict: CONFIRMED
- Severity: Low
- Steps to reproduce: Save BP and other readings. In Settings, switch App Language to Bahasa Melayu. Open Eksport Data, generate the default 30-day report, and select Print from the Android share sheet. Inspect page 1. The report title, medication sections, and glucose/cholesterol headings are Malay, but “Blood Pressure Readings,” “Date,” “Systolic,” “Diastolic,” and “Notes” remain English.
- Root cause: `src/services/export.ts:268` — the BP heading is literal English. The column labels at line 272 are also literals. The Malay heading translation already exists at `src/i18n/ms.json:653`.
- Suggested fix: Use the existing export_pdf translation keys for the BP heading and column labels.
- Evidence: [verify-shots/37-report-ms-page1.png](verify-shots/37-report-ms-page1.png), [verify-shots/38-report-ms-page2.png](verify-shots/38-report-ms-page2.png).

### VIT-04: Chat context toggles remain English in Bahasa Melayu

- Verdict: CONFIRMED
- Severity: Low
- Steps to reproduce: Set Bahasa Melayu in Settings and open the ChatBot/Dhia screen using the robot button. Inspect the greeting, composer, and context pills. Toggle both pills on. The greeting, placeholder, and Hantar button are Malay; Vitals and Meds remain English in both states.
- Root cause: `src/screens/ChatBotScreen.tsx:222` and `src/screens/ChatBotScreen.tsx:238` — the context labels are hardcoded instead of using translations.
- Suggested fix: Add localized context labels and obtain them through `t(...)`.
- Evidence: [verify-shots/39-chat-ms-initial.png](verify-shots/39-chat-ms-initial.png), [verify-shots/42-chat-ms-context-on.png](verify-shots/42-chat-ms-context-on.png).

### VIT-05: Chat request failure silently discards the submitted message

- Verdict: CONFIRMED
- Severity: Medium
- Steps to reproduce: Open ChatBot, disable emulator Wi-Fi and mobile data, type “What is a normal blood pressure,” dismiss the keyboard, and tap Hantar. Wait for completion. The draft clears and the submitted bubble disappears; only the original greeting remains, with no error or retry control. Re-enable both network transports. The same message-loss behavior occurs on subsequent failed requests in Malay and English.
- Root cause: `src/screens/ChatBotScreen.tsx:125` — the catch block constructs the localized error message but never appends it. Line 132 removes the submitted user message. The input was already cleared at line 105 and is never restored.
- Suggested fix: Retain the submitted message, display the localized failure, and provide retry or restore the draft. Remove loading state without deleting the user's input.
- Evidence: [verify-shots/40-chat-offline-draft.png](verify-shots/40-chat-offline-draft.png), [verify-shots/41-chat-offline-result.png](verify-shots/41-chat-offline-result.png), [verify-shots/73-chat-online-final-en.png](verify-shots/73-chat-online-final-en.png), [verify-chat-offline-logcat.txt](verify-chat-offline-logcat.txt), [verify-chat-online-final-logcat.txt](verify-chat-online-final-logcat.txt).
- Refinement: Offline operation is deliberate test setup, but silently losing the message is an app defect. Successful online responses remain blocked separately by VIT-S04.

### VIT-06: Reminder shows success when permission is denied or scheduling fails

- Verdict: CONFIRMED
- Severity: Medium
- Steps to reproduce: Deny the notification prompts after resetting the app. Complete onboarding and consent, then scroll Home to Daily vitals reminder and tap its switch. The switch turns on and “Notifications enabled” appears even though permission is denied. Dismiss the alert, grant POST_NOTIFICATIONS on this emulator, clear logcat, and tap again. The same success alert appears while logcat records `ERR_NOTIFICATIONS_FAILED_TO_SCHEDULE` with “Failed to schedule the notification. org.json.JSONObject.”
- Root cause: `src/screens/HomeScreen.tsx:521` — the handler ignores the return values of initialization and scheduling, then unconditionally sets the switch on and displays success at line 523. `src/services/notifications.ts:63` returns false on permission denial; line 455 catches scheduling errors and returns null, so the Home catch block is not reached for these failures.
- Suggested fix: Stop on denied permission or a null schedule identifier. Keep the switch off and display the appropriate failure. Show success only after a reminder has been scheduled or an existing schedule verified.
- Evidence: [verify-shots/22-reminder-denied.png](verify-shots/22-reminder-denied.png), [verify-shots/23-reminder-granted.png](verify-shots/23-reminder-granted.png), [verify-notification-denied-logcat.txt](verify-notification-denied-logcat.txt), [verify-notification-granted-logcat.txt](verify-notification-granted-logcat.txt).
- Refinement: The scheduling exception's underlying native cause was not isolated. Ignoring the explicit false/null results and showing success is independently confirmed in app source and UI.

### VIT-07: Daily reminder switch has no disable action

- Verdict: CONFIRMED
- Severity: Medium
- Steps to reproduce: With notification permission granted, tap Home's Daily vitals reminder switch. Dismiss “Notifications enabled,” then tap the now-on switch again. The app repeats the same success alert and the switch remains on.
- Root cause: `src/screens/HomeScreen.tsx:519` — every press executes the initialization/scheduling path and sets `notificationsEnabled` to true. There is no branch that cancels the reminder and sets the state false.
- Suggested fix: Branch on the actual enabled/scheduled state. Cancel the daily reminder when disabling and update the switch after successful cancellation; initialize and schedule only when enabling.
- Evidence: [verify-shots/23-reminder-granted.png](verify-shots/23-reminder-granted.png), [verify-shots/24-reminder-second-tap.png](verify-shots/24-reminder-second-tap.png), [verify-notification-granted-logcat.txt](verify-notification-granted-logcat.txt).
- Refinement: Native scheduling fails in this build during the test, so an active reminder's cancellation could not be observed. The repeated enable-only UI behavior and missing disable branch are confirmed; duplicate scheduled reminders are not claimed.

### VIT-08: Standalone AddVital screen has no reachable in-app entry point

- Verdict: CONFIRMED
- Severity: Low
- Steps to reproduce: Inspect the entire Vitals tab before any readings exist. Save readings through Home and inspect the populated Vitals tab from top to bottom, including the profile and risk actions. Return to Home and select Log today's vitals or Update today's vitals. These controls open the four-step DailyVitalsLog flow. No visible action opens the standalone AddVital BP, glucose, or weight forms.
- Root cause: `src/navigation/AppNavigator.tsx:334` registers AddVital, but there is no navigation call to it in `src/`. `src/screens/VitalsScreen.tsx:419` declares quickAddOptions without rendering or using them. Home explicitly navigates to DailyVitalsLog at `src/screens/HomeScreen.tsx:516`.
- Suggested fix: Render visible individual add-vital actions that navigate to AddVital with the selected type, or remove the unused route and provide equivalent individual-entry functionality in the supported flow.
- Evidence: [verify-shots/12-vitals-empty.png](verify-shots/12-vitals-empty.png), [verify-shots/26-five-vitals-saved.png](verify-shots/26-five-vitals-saved.png), [verify-shots/27-vitals-lower.png](verify-shots/27-vitals-lower.png), [verify-shots/60-vitals-end-confirmed.png](verify-shots/60-vitals-end-confirmed.png), [verify-shots/25-bp-empty.png](verify-shots/25-bp-empty.png).

### VIT-S01: Exported report omits saved weight readings

- Verdict: CONFIRMED
- Severity: Medium
- Steps to reproduce: Save BP 120/80, weight 78 kg, height 175 cm, glucose 5.5, total cholesterol 5.0, and HDL 1.4 through DailyVitalsLog. Verify the weight on Vitals. Generate a report and inspect both pages in Print preview. BP, glucose, total cholesterol, and HDL appear, but there is no Weight Readings section or 78 kg value. This occurs in the inspected English and Malay 30-day PDFs.
- Root cause: `src/services/export.ts:17` — generateReportHTML renders several recentVitals sections but never renders recentVitals.weight. Weight is queried at line 557 and included in the gathered report data at line 617, so the omission is in the HTML template.
- Suggested fix: Render a localized weight table with date, value, unit, and notes when weight readings exist.
- Evidence: [verify-shots/26-five-vitals-saved.png](verify-shots/26-five-vitals-saved.png), [verify-shots/31-report-en-page1.png](verify-shots/31-report-en-page1.png), [verify-shots/32-report-en-page2.png](verify-shots/32-report-en-page2.png), [verify-shots/37-report-ms-page1.png](verify-shots/37-report-ms-page1.png), [verify-shots/38-report-ms-page2.png](verify-shots/38-report-ms-page2.png).

### VIT-S02: Vitals tab omits blood pressure and its empty-state message

- Verdict: CONFIRMED
- Severity: Medium
- Steps to reproduce: After a clean onboarding, open Vitals before logging anything. It shows profile/risk controls and blank space, without the no-vitals message. Save BP 120/80 and the other standard readings through Home. Scroll Vitals fully from top to bottom: weight, glucose, and cholesterol cards appear, but no blood-pressure card or BP history appears. Home and the exported PDF show the saved BP, establishing that the reading was saved.
- Root cause: `src/screens/VitalsScreen.tsx:703` — liveSections is populated with BP content at line 707 and empty-state content at line 969 but is never rendered. The returned JSX beginning at line 982 renders separate cards for other types and has no BP card or equivalent empty-state message.
- Suggested fix: Render the prepared sections or add a dedicated BP card and empty-state component to the actual JSX, avoiding duplicate cards for the other vital types.
- Evidence: [verify-shots/12-vitals-empty.png](verify-shots/12-vitals-empty.png), [verify-shots/13-vitals-empty-lower.png](verify-shots/13-vitals-empty-lower.png), [verify-shots/26-five-vitals-saved.png](verify-shots/26-five-vitals-saved.png), [verify-shots/27-vitals-lower.png](verify-shots/27-vitals-lower.png), [verify-shots/58-vitals-cholesterol.png](verify-shots/58-vitals-cholesterol.png), [verify-shots/60-vitals-end-confirmed.png](verify-shots/60-vitals-end-confirmed.png), [verify-shots/31-report-en-page1.png](verify-shots/31-report-en-page1.png).

### VIT-S03: DailyVitalsLog accepts HDL cholesterol greater than total cholesterol

- Verdict: CONFIRMED
- Severity: Medium
- Steps to reproduce: Open Home → Update today's vitals. Enter BP 80/40, weight 30 kg, height 100 cm, and glucose 3 mmol/L. In Cholesterol, enter total 2 mmol/L and HDL 4 mmol/L, then Finish. Both values are accepted and Home displays total cholesterol 2.0 alongside HDL cholesterol 4.0. The same pair appears in the Vitals history.
- Root cause: `src/screens/DailyVitalsLogScreen.tsx:126` — validation checks each field's independent range. The only cross-field check at line 136 is BP ordering. No cholesterol relationship is checked before the two values are persisted at line 163.
- Suggested fix: Validate the total/HDL relationship together and prevent submission when HDL exceeds total cholesterol, with a localized field error.
- Evidence: [verify-shots/54-hdl-exceeds-total.png](verify-shots/54-hdl-exceeds-total.png), [verify-shots/61-home-boundary-values.png](verify-shots/61-home-boundary-values.png), [verify-shots/58-vitals-cholesterol.png](verify-shots/58-vitals-cholesterol.png), [verify-shots/59-vitals-end.png](verify-shots/59-vitals-end.png).

### VIT-S04: Online chatbot verification is blocked by network and DNS environment failures

- Verdict: ENVIRONMENT
- Severity: High
- Steps to reproduce: Re-enable emulator Wi-Fi and mobile data after the offline test. Send “What are my latest vital readings” with both context pills on; the request fails with Axios Network Error. Repeat in English with “Hello QA connectivity check”; the same failure occurs. Independently open https://mymedix-api.fly.dev in Chrome on emulator-5558: Chrome shows “No internet connection” and reports that the DNS address could not be found. Emulator hostname checks fail for both the API and chatbot hosts. On the host computer, the API returns HTTP 200, while the chatbot hostname also fails resolution.
- Root cause: No app-side root cause is established for connection failure. Emulator network/DNS failure is independently demonstrated outside MyKencing. `src/services/chatclient.ts:142` posts to `https://mymedix-chatbot.fly.dev/ask`, a separate hostname from the live API supplied in the task; that hostname also fails the host-side DNS check. An HTTP status or response body from the chatbot was not obtained.
- Suggested fix: Restore emulator internet/DNS connectivity and verify the chatbot service hostname independently. Then repeat successful response, context inclusion, multi-turn history, and language checks. Resolve VIT-05 so environment failures are visible to users.
- Evidence: [verify-shots/68-emulator-browser-dns-failure.png](verify-shots/68-emulator-browser-dns-failure.png), [verify-shots/73-chat-online-final-en.png](verify-shots/73-chat-online-final-en.png), [verify-network.txt](verify-network.txt), [verify-connectivity.txt](verify-connectivity.txt), [verify-chat-online-logcat.txt](verify-chat-online-logcat.txt), [verify-chat-online-final-logcat.txt](verify-chat-online-final-logcat.txt).

## Additional coverage and remaining limits

- DailyVitalsLog required-field checks passed for empty BP, height, and glucose. Invalid BP `NaN/0`, `79/39`, `221/141`, and ordering `80/90` were rejected. BP endpoints `80/40` and `220/140` saved successfully.
- Weight/height values `29/99`, `251/231`, and negative weight with empty height were rejected. Endpoints `30 kg / 100 cm` and `250 kg / 230 cm` saved successfully. Glucose 2.9 and 30.1 were rejected; 3 and 30 mmol/L saved successfully. Evidence: [45-bp-above-range.png](verify-shots/45-bp-above-range.png), [47-bp-below-range.png](verify-shots/47-bp-below-range.png), [48-weight-height-below-range.png](verify-shots/48-weight-height-below-range.png), [49-weight-height-above-range.png](verify-shots/49-weight-height-above-range.png), [51-glucose-above-range.png](verify-shots/51-glucose-above-range.png), [52-glucose-below-range.png](verify-shots/52-glucose-below-range.png), [74-bp-nonnumeric-zero.png](verify-shots/74-bp-nonnumeric-zero.png), [75-negative-weight-empty-height.png](verify-shots/75-negative-weight-empty-height.png), [76-glucose-required.png](verify-shots/76-glucose-required.png), [79-home-upper-boundaries.png](verify-shots/79-home-upper-boundaries.png).
- Cholesterol independent bounds worked: total 1.9/12.1 and HDL 0.4/4.1 were rejected; total 2/12 and HDL 0.5/4 were accepted. The missing relationship check is VIT-S03. Evidence: [53-cholesterol-range.png](verify-shots/53-cholesterol-range.png), [77-cholesterol-other-limits.png](verify-shots/77-cholesterol-other-limits.png).
- DailyVitalsLog's on-screen Back retained the entered BP values. Saved vitals and height survived force-stop/relaunch. Evidence: [50-back-retains-bp.png](verify-shots/50-back-retains-bp.png), [66-vitals-retained-relaunch.png](verify-shots/66-vitals-retained-relaunch.png).
- Analytics 7/30/90-day selections worked. Clear Data set all analytics counts to zero and retained the health readings. Evidence: [64-analytics-cleared.png](verify-shots/64-analytics-cleared.png), [65-vitals-retained-after-clear.png](verify-shots/65-vitals-retained-after-clear.png).
- Export generated populated 7/30/90-day PDFs and opened the Android share sheet. English and Malay 30-day PDFs were inspected across both pages. After a second reset, a 7-day report with no medicines or vitals generated a one-page PDF and returned to Export correctly. No external message or upload was sent. Evidence: [69-empty-report-share.png](verify-shots/69-empty-report-share.png), [70-empty-report-preview.png](verify-shots/70-empty-report-preview.png), [71-empty-report-return.png](verify-shots/71-empty-report-return.png).
- Chat empty/whitespace-only send was disabled, English and Malay greetings rendered, and both context pills toggled. Successful replies, received context, multi-turn responses, and response localization could not be verified because of VIT-S04. Evidence: [72-chat-whitespace-disabled.png](verify-shots/72-chat-whitespace-disabled.png).
- Standalone AddVital BP/glucose/weight forms remain unreachable due to VIT-08. Its source, including `src/screens/AddVitalScreen.tsx:57`, was inspected, but its edge-value behavior was not executed. Settings only displays the unit values, so mg/dL and lb entry/conversion paths also could not be reached through this release UI. No hidden-route injection or app modification was used.
- Gboard initially used stylus handwriting mode; normal keyboard mode was enabled on the assigned emulator before continuing. This was test setup, not an app defect. Wi-Fi and mobile data were re-enabled after the deliberate offline test. The final app is on English Home with the fake upper-boundary dataset from [79-home-upper-boundaries.png](verify-shots/79-home-upper-boundaries.png); earlier datasets were reset for empty-state testing.
- No app crash was observed. Captured runtime failures were notification scheduling and chat network errors. No source fixes, build, or installation were performed.

## Summary

| ID | Title | Verdict | Severity |
|---|---|---|---|
| VIT-01 | Profile fields disappear on reload | CONFIRMED | Medium |
| VIT-02 | Analytics omits glucose and weight | CONFIRMED | Medium |
| VIT-03 | Malay BP export remains partly English | CONFIRMED | Low |
| VIT-04 | Malay chat context pills remain English | CONFIRMED | Low |
| VIT-05 | Failed chat discards the submitted message | CONFIRMED | Medium |
| VIT-06 | Reminder falsely reports success | CONFIRMED | Medium |
| VIT-07 | Daily reminder cannot be switched off | CONFIRMED | Medium |
| VIT-08 | Standalone AddVital has no entry point | CONFIRMED | Low |
| VIT-S01 | Export omits weight readings | CONFIRMED | Medium |
| VIT-S02 | Vitals omits BP and empty-state content | CONFIRMED | Medium |
| VIT-S03 | HDL greater than total cholesterol accepted | CONFIRMED | Medium |
| VIT-S04 | Online chat blocked by network/DNS setup | ENVIRONMENT | High |
