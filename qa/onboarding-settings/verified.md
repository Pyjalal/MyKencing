# MyKencing QA verification: onboarding and settings

Verified on 2026-10-01 using only `adb -s emulator-5554`. Device: `sdk_gphone64_x86_64`, Android 15, 1080 x 2400. Installed release: `com.mykencing.app`, version 1.0.0 (versionCode 1), targetSdk 35. The device clock reported October 1, 2026, GMT. The installed UI uses the name MyMedix.

All nine reports were independently reproduced after clearing this app's test data. Source references below refer to the current working tree; existing source changes were left untouched. Screenshots and accompanying UI XML are from this verification pass, not the exploration agent. No app code was changed. Three additional findings are recorded as ONB-S01 through ONB-S03.

### ONB-01: Onboarding accepts age and weight outside its stated limits

- Verdict: CONFIRMED
- Severity: Medium
- Steps to reproduce: Clear app data and launch. Tap Get Started. Enter age `1` and weight `1`, with Male selected, then tap Next. The app advances to goal selection. Return to Personal Info, enter age `45` and weight `221`, and tap Next; this also advances. As controls, age `121` triggers an alert stating age must be 8–120, and weight `501` triggers an alert stating weight must be 25–220 kg.
- Root cause: `src/screens/OnboardingPersonalInfoScreen.tsx:39` accepts ages 1–120; `src/screens/OnboardingPersonalInfoScreen.tsx:44` accepts weights 1–500. The button eligibility check at `src/screens/OnboardingPersonalInfoScreen.tsx:52` uses the same minimum of 1 and omits upper bounds. These rules disagree with the displayed limits in `src/i18n/en.json:300` and `src/i18n/en.json:301`.
- Suggested fix: Use shared age and weight bounds for both Next eligibility and submission validation, and make the localized alerts describe those same bounds.
- Evidence: [invalid values](verify-shots/onb01-invalid-personal.png), [accepted goal screen](verify-shots/onb01-accepted-goal.png), [age alert](verify-shots/onb01-age-alert.png), [weight alert](verify-shots/onb01-weight-alert.png), [221 kg accepted](verify-shots/onb01-overstated-max-accepted.png).

### ONB-02: Saved optional settings disappear when reloaded

- Verdict: CONFIRMED
- Severity: High
- Steps to reproduce: Complete onboarding with age `45`, Male, weight `72.5`, and Be healthy; accept consent. Open Profile & Settings using the person icon at the upper left. Enter `Test User`, tap Save, leave Settings, and reopen it. The name is blank and Home greets Friend. Complete the risk questionnaire with age `45`, Male, and waist `92 cm`; Health Profile reports age Not recorded and Gender not set. Open Risk Assessment, edit age to `45`, and save; it still reports Age not set. Save vitals, switch to Malay, force-stop and relaunch. Malay and vitals remain, while the name remains missing.
- Root cause: `src/stores/settingsStore.ts:84` hydrates a row only if its key already exists in the object built from `DEFAULT_SETTINGS` at `src/stores/settingsStore.ts:39`. Optional keys such as `userName`, `userAge`, `userGender`, `userWeight`, `userGoal`, `consentDate`, and `ramadan` are absent. `updateSettings` writes them to SQLite and immediately reloads at `src/stores/settingsStore.ts:129`, dropping them from in-memory settings. This is a hydration defect; the device observations do not establish that those SQLite rows were deleted.
- Suggested fix: Hydrate all supported AppSettings keys using an explicit complete schema or allowlist, including optional fields. Preserve optional values on the reload after saving and on startup.
- Evidence: [name entered](verify-shots/onb02-name-entered.png), [name after Save](verify-shots/onb02-name-saved.png), [name after reopening](verify-shots/onb02-name-reopened.png), [missing age and gender](verify-shots/onb02-health-profile.png), [age after re-save](verify-shots/onb02-risk-age-save.png), [Malay and vitals after restart](verify-shots/onb02-restart-ms-vitals.png), [missing name after restart](verify-shots/onb02-restart-settings-name.png).
- Coverage extension: Valid Ramadan settings also disappear under this same cause. Set Sahur `05:45`, Iftar `19:30`, start `2027-02-08`, end `2027-03-09`, and enable adjustments. After the success alert, leave and reopen Ramadan Mode: the switch is off, times revert to `05:30`/`19:15`, and dates are empty. The same defaults appear after restarting. This is included here rather than counted as a separate new bug. Evidence: [valid apply](verify-shots/ramadan-valid-enabled.png), [reopened defaults](verify-shots/ramadan-reopened.png), [restart defaults](verify-shots/ramadan-restart-empty.png). Medication restoration was not verified with a populated medication schedule.

### ONB-03: Ramadan accepts impossible times and dates

- Verdict: CONFIRMED
- Severity: Medium
- Steps to reproduce: Open Settings > Ramadan Mode. Enter `99:99` in both time fields, `2026-13-45` in Start date, and `2026-03-20` in End date. Tap Apply Adjustments. The app displays “Medication schedules adjusted for Ramadan.” No validation error appears. Reproduced twice, with no medications configured.
- Root cause: `src/screens/RamadanModeScreen.tsx:47` starts applying adjustments without checking time ranges, calendar validity, or date ordering. It passes the raw strings to the medication adjustment function at line 54 and to settings at line 60. The inputs at `src/screens/RamadanModeScreen.tsx:114` are unrestricted text fields. `src/utils/ramadanAdjustments.ts:10` also accepts the supplied replacement time strings without validating them.
- Suggested fix: Validate HH:mm values as 00:00–23:59, validate real calendar dates, and require start date to be no later than end date before changing any schedule or settings. Show field-specific errors.
- Evidence: [invalid inputs](verify-shots/onb03-invalid-inputs.png), [success despite invalid inputs](verify-shots/onb03-invalid-applied.png). This confirms acceptance and misleading success; actual medication rescheduling with those values was not exercised.

### ONB-04: Ramadan Auto-set Dates fills a past period

- Verdict: CONFIRMED
- Severity: Low
- Steps to reproduce: With the device date October 1, 2026, open Ramadan Mode and tap Auto-set Dates. Start becomes `2026-02-19` and end becomes `2026-03-20`. Both dates are in the past, with no historical-period explanation.
- Root cause: `src/screens/RamadanModeScreen.tsx:40` requests Ramadan for the current Gregorian year only. It does not compare the returned period with today's date before filling it at line 42. `src/utils/ramadanAdjustments.ts:59` contains the 2026 period; `src/utils/ramadanAdjustments.ts:67` returns a period for the requested year. The confirmed defect concerns choosing a past period, not independent verification of lunar-calendar dates.
- Suggested fix: Select the current Ramadan when it is ongoing, otherwise the next upcoming period; explicitly label historical dates if that is the intended feature.
- Evidence: [past auto-filled dates](verify-shots/onb04-auto-dates.png).

### ONB-05: Risk calculator cards render untranslated label keys

- Verdict: CONFIRMED
- Severity: Medium
- Steps to reproduce: From Home, open Manage inputs. Enable FINDRISC and complete the risk questionnaire. Enable Framingham and return from Risk Assessment. Scroll to Latest scores. Both cards show `RISK_CALCULATORS.FINDRISC_LABEL` and `RISK_CALCULATORS.FRAMINGHAM_LABEL`. Switch to Bahasa Melayu and repeat: both labels remain raw keys while surrounding text translates.
- Root cause: `src/utils/riskScores.ts:113` and `src/utils/riskScores.ts:184` return translation keys as result labels. `src/components/RiskScoreCircle.tsx:23` renders `result.label` directly; its label style capitalizes the visible text. The translations exist in `src/i18n/en.json:483` and `src/i18n/ms.json:483`.
- Suggested fix: Translate the result label at render time with `t(result.label)`, as the trend-card rendering already does. Verify both calculators in both languages.
- Evidence: [English calculator cards](verify-shots/onb05-calculator-results.png), [Malay calculator cards](verify-shots/onb05-calculators-ms.png), [same label defect in Health Profile](verify-shots/onbs01-health-profile-score.png).

### ONB-06: Home FINDRISC trend disagrees with the current calculator result

- Verdict: CONFIRMED
- Severity: Medium
- Steps to reproduce: On a fresh profile, complete the risk questionnaire with Male, age `45`, waist `92 cm`, No BP medication, No history of high glucose, No smoking, Yes to activity, Not every day for vegetables, and None for family history. Do not log a daily waist measurement. Enable FINDRISC. Risk Calculators shows `5/26`; return to Home and scroll to FINDRISC. Home's latest trend score and average show `1/26`.
- Root cause: `src/screens/HomeScreen.tsx:435` gets waist only from `findWaistBeforeDate(date)` and passes the resulting null at line 441. The current-score calculation in that screen uses the questionnaire fallback at `src/screens/HomeScreen.tsx:273`; Risk Calculators does likewise at `src/screens/RiskCalculatorScreen.tsx:78`. Consequently the trend omits waist points even for its latest bucket. `src/screens/HomeScreen.tsx:254` uses that bucket as the displayed score. ONB-02 also drops the submitted age and gender; the observed `5/26` is the installed app's output, not an assertion that it is the correct clinical score for the entered profile.
- Suggested fix: Resolve current and historical inputs consistently, including questionnaire waist when no measurement exists. Ensure the displayed latest score and its risk category come from the same result, and repair profile hydration separately.
- Evidence: [calculator 5/26](verify-shots/onb05-calculator-results.png), [Home 1/26](verify-shots/onb06-home-trend.png). A later test with new weight also produced a `4/26` Home trend labeled Moderate risk because the category came from the separate current calculation: [later inconsistent card](verify-shots/onbs03-home-score-new-weight.png).

### ONB-07: Privacy Policy row does not open anything

- Verdict: CONFIRMED
- Severity: Low
- Steps to reproduce: Open Settings and scroll to Data & Privacy. Tap View Privacy Policy and wait. The same Settings screen remains visible, without navigation, browser launch, alert, or explanation.
- Root cause: `src/screens/SettingsScreen.tsx:176` creates the TouchableOpacity without an `onPress` handler. The adjacent Export Data and Delete All Data controls have handlers.
- Suggested fix: Connect the row to a policy screen or policy URL; show an explicit unavailable state if no policy content exists.
- Evidence: [before tapping](verify-shots/settings-bottom.png), [after tapping](verify-shots/onb07-policy-noop.png).

### ONB-08: Home reminder reports success when initialization or scheduling fails

- Verdict: CONFIRMED
- Severity: Medium
- Steps to reproduce: Allow the Android notification permission. Scroll to the bottom of Home and tap the Daily vitals reminder control. It reports Notifications enabled and turns blue, while logcat records `ERR_NOTIFICATIONS_FAILED_TO_SCHEDULE`. Then revoke `android.permission.POST_NOTIFICATIONS` for this app, force-stop/relaunch, and choose Don't allow in the Android prompt. Scroll fully to the bottom and tap the control again. It again reports success and turns on; logcat reports both “Notification permissions not granted” and the scheduling failure. The package permission dump confirms `granted=false` for the denied run.
- Root cause: `src/screens/HomeScreen.tsx:521` ignores the boolean returned by `initializeNotifications`, then ignores the reminder identifier/null returned by `ensureDailyVitalsReminderScheduled` at line 522. It unconditionally sets enabled and displays success at line 523. `src/services/notifications.ts:63` returns false when permission is denied, while `src/services/notifications.ts:455` catches a scheduling error and returns null. These failures never reach Home's catch block.
- Suggested fix: Check both results, stop immediately on permission denial, and turn the control on only after obtaining a valid scheduled reminder identifier. Surface a useful error and keep it off on failure.
- Evidence: [allowed success alert](verify-shots/onb08-allowed-success.png), [allowed failure log](verify-shots/onb08-allowed-logcat.txt), [denied success alert](verify-shots/onb08-denied-success.png), [denied control on](verify-shots/onb08-denied-switch.png), [denied log](verify-shots/onb08-denied-logcat.txt), [denied permission state](verify-shots/onb08-denied-permission.txt). Log times: allowed 09:42:51, denied 09:46:41 on the device clock.
- Environment distinction: The native scheduling error's underlying cause was not isolated. The confirmed app defect is false success despite failure and denied permission; that behavior is not explained away by emulator setup.

### ONB-09: Home reminder control cannot be turned off

- Verdict: CONFIRMED
- Severity: Low
- Steps to reproduce: Tap the Home Daily vitals reminder control, dismiss Notifications enabled, and observe the blue/on control. Tap it a second time. The app repeats Notifications enabled and leaves the control on.
- Root cause: `src/screens/HomeScreen.tsx:829` always invokes `handleNotificationTogglePress`. That handler at `src/screens/HomeScreen.tsx:519` only initializes/schedules, sets state to true, and shows the enable alert. It has no branch that cancels the daily reminder or sets state false. The control is a custom TouchableOpacity, not a native Switch.
- Suggested fix: Implement both enable and disable paths. On disable, cancel the daily vitals reminder and set the state off. Initialize the visual state from the actual scheduled reminder so it also survives navigation/restart correctly.
- Evidence: [control on after first tap](verify-shots/onb09-switch-on.png), [repeated enable alert on second tap](verify-shots/onb09-second-tap.png).

### ONB-S01: Health Profile FINDRISC score omits the questionnaire waist

- Verdict: CONFIRMED
- Severity: Medium
- Steps to reproduce: Use the questionnaire answers from ONB-06, including waist `92 cm`, with FINDRISC enabled and no daily waist measurement. Immediately after Finish, scroll to Health Profile's Risk Scores: FINDRISC shows `1/26`. Open Risk Calculators for the same unchanged inputs: it shows `5/26`.
- Root cause: `src/screens/HealthProfileScreen.tsx:87` passes `latestWaist?.value ?? null` to FINDRISC. Unlike `src/screens/RiskCalculatorScreen.tsx:78`, it never falls back to `riskFactors.waistCircumference`. This is a separate current-score call site from the Home trend defect in ONB-06.
- Suggested fix: Use the same waist-input resolver for Health Profile, Risk Assessment, Risk Calculators, and Home. Include the questionnaire value when a measured value is absent.
- Evidence: [Health Profile 1/26](verify-shots/onbs01-health-profile-score.png), [Risk Calculators 5/26](verify-shots/onb05-calculator-results.png).

### ONB-S02: Home weekday labels remain English in Bahasa Melayu

- Verdict: CONFIRMED
- Severity: Low
- Steps to reproduce: Open Settings and switch App Language from English to Bahasa Melayu. Return to Home. The greeting, tab names, vitals labels, and risk text translate, but the seven-day calendar still displays `FRI`, `SAT`, `SUN`, `MON`, `TUE`, `WED`, `THU`. Force-stop and relaunch with Malay saved; the same English weekday labels remain.
- Root cause: `src/screens/HomeScreen.tsx:605` calls `format(date, 'EEE')` without passing a locale tied to the app language. `useTranslation` updates surrounding strings but does not localize this date-fns call.
- Suggested fix: Map the active language to the appropriate date-fns locale, pass it to calendar date formatting, and update when the app language changes.
- Evidence: [Malay Home with English weekdays](verify-shots/language-home-ms.png), [same after restart](verify-shots/onb02-restart-ms-vitals.png).

### ONB-S03: Risk Calculators and Risk Assessment keep an older profile weight after new vitals

- Verdict: CONFIRMED
- Severity: Medium
- Steps to reproduce: With the ONB-06 questionnaire saved and both calculators enabled, log vitals at `72.5 kg` and `180 cm`. In Risk Assessment's BMI Edit dialog, save `72.5` and `180`; BMI displays `22.4` and FINDRISC is `5/26`. Return to Home > Update today's vitals and complete a new entry with weight `100 kg`, height `180 cm`, BP `120/80`, glucose `5.5`, total cholesterol `4.5`, and HDL `1.2`. Home displays the new `100.0 kg`. Reopen Risk Calculators: FINDRISC remains `5/26`. Open Risk Assessment: BMI still displays `22.4`, and its Edit dialog still contains `72.5 kg`/`180 cm`. The new measured weight implies BMI about `30.9`.
- Root cause: `src/screens/RiskCalculatorScreen.tsx:69` chooses `riskFactors.weightKg` before the latest measured weight. `src/screens/RiskAssessmentScreen.tsx:118` uses the same priority. Daily logging at `src/screens/DailyVitalsLogScreen.tsx:166` updates height while preserving the older risk-factor weight. In contrast, `src/screens/HomeScreen.tsx:292` prefers the latest measured weight. Health Profile has the same older-weight priority at `src/screens/HealthProfileScreen.tsx:73`.
- Suggested fix: Use a shared weight resolver that gives the latest measured weight precedence over an older profile value, with unit conversion and consistent recalculation across all risk screens. Keep the BMI display and calculator scores based on the same resolved measurements.
- Evidence: [baseline BMI](verify-shots/bmi-baseline-saved.png), [new Home weight](verify-shots/onbs03-home-latest-weight.png), [calculator still 5/26](verify-shots/onbs03-calculator-after-weight.png), [BMI still 22.4](verify-shots/onbs03-risk-bmi-after-weight.png), [older weight still in dialog](verify-shots/onbs03-stored-weight-dialog.png), [Home score changes with new weight](verify-shots/onbs03-home-score-new-weight.png). Home's simultaneous waist omission remains covered by ONB-06.

## Coverage gap checks and limits

- Consent state: Selecting consent, tapping Decline, and then tapping disabled I Agree kept the user on consent. Selecting consent again allowed entry. Delete All Data required consent anew; it was initially unchecked with Agree disabled. Evidence: [Decline](verify-shots/consent-decline.png), [disabled Agree](verify-shots/consent-disabled-agree.png), [consent after reset](verify-shots/reset-consent-unchecked.png).
- Numeric boundaries: Risk onboarding age `9` and waist `39 cm` kept Next disabled; age `45` and waist `92 cm` allowed completion. Personal Info's upper-weight mismatch was additionally tested as ONB-01. Evidence: [age 9](verify-shots/risk-age-9-disabled.png), [waist 39](verify-shots/risk-waist-39-disabled.png).
- Language propagation: Tested Settings, Home, Health Profile, Risk Assessment, Risk Onboarding, Risk Calculators, and Ramadan in Malay, then switched back to English. Translations updated on those screens except the label keys and weekdays reported above. Evidence: [Health Profile](verify-shots/language-health-ms.png), [Risk Assessment](verify-shots/language-risk-assessment-ms.png), [Risk Onboarding](verify-shots/language-risk-onboarding-ms.png), [Ramadan](verify-shots/language-ramadan-ms.png).
- Restart persistence: Force-stop/relaunch preserved Malay and the recorded BP, glucose, weight, cholesterol, and height. Optional profile and Ramadan fields did not survive reload, as described in ONB-02. Home resumed directly after accepted onboarding.
- Full data reset: The exploration pass only canceled Delete All Data. This pass confirmed deletion after recording vitals and enabling both calculators. The app showed the deletion alert, returned to welcome, required consent, and then showed an empty Home calendar, both calculators off, and default Settings. No crash was observed; the captured reset log contains no AndroidRuntime crash. Evidence: [confirmation](verify-shots/delete-confirmation.png), [deleted alert](verify-shots/delete-completed.png), [welcome](verify-shots/reset-welcome.png), [empty Home](verify-shots/reset-home-empty.png), [calculators off](verify-shots/reset-calculators-off.png), [Settings defaults](verify-shots/reset-settings-defaults.png), [reset log](verify-shots/reset-logcat.txt).
- Ramadan persistence and empty-medication Apply/Restore were exercised. Restore displayed its success alert. Changes to an actual populated medication schedule were not verified because medicine creation/search and medication scheduling are outside this assigned area. Evidence: [Restore alert](verify-shots/ramadan-restore-success.png).
- Launches used the installed release and included a fresh app-data launch and repeated force-stop/relaunch. The brief splash animation was not separately captured or timing-tested. Camera access is not exposed in these scoped screens. Backend-dependent medicine search, drug interactions, export contents, real notification delivery at midnight, and other emulators were not tested.
- An occasional UI Automator idle/dump failure was retried; it is a capture-tool limitation, not an app finding. No environment-only verdict was needed for the nine reported app behaviors. The exact native notification scheduling failure remains unisolated, as noted in ONB-08.

## Summary

Nine original reports confirmed; zero not reproduced; zero environment-only. Three new bugs confirmed. Severity totals: 1 High, 7 Medium, 4 Low.

| ID | Title | Verdict | Severity |
| --- | --- | --- | --- |
| ONB-01 | Onboarding limits disagree with validation | CONFIRMED | Medium |
| ONB-02 | Optional settings disappear on reload | CONFIRMED | High |
| ONB-03 | Impossible Ramadan times/dates accepted | CONFIRMED | Medium |
| ONB-04 | Auto-set Ramadan dates are in the past | CONFIRMED | Low |
| ONB-05 | Calculator cards display label keys | CONFIRMED | Medium |
| ONB-06 | Home FINDRISC trend differs from calculator | CONFIRMED | Medium |
| ONB-07 | Privacy Policy row has no action | CONFIRMED | Low |
| ONB-08 | Reminder success despite failure/denial | CONFIRMED | Medium |
| ONB-09 | Reminder control has no off path | CONFIRMED | Low |
| ONB-S01 | Health Profile omits questionnaire waist | CONFIRMED | Medium |
| ONB-S02 | Malay Home retains English weekdays | CONFIRMED | Low |
| ONB-S03 | Risk screens prefer older profile weight | CONFIRMED | Medium |
