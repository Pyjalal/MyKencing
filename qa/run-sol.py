import subprocess, pathlib, shutil
CODEX=shutil.which('codex')
tpl = pathlib.Path('sol-prompt.md').read_text(encoding='utf-8')
areas = [
 ("emulator-5554","onboarding-settings","ONB","Splash, Onboarding (goal, personal info), PrivacyConsent, RiskOnboarding, Home tab/HomeScreen, Settings, HealthProfile, RamadanMode, language switching, RiskCalculators, RiskAssessment."),
 ("emulator-5556","medications","MED","Medications tab, AddMedicine (search, manual entry, form validation), MedicineDetail, ScanPrescription (camera), SelectScannedMedicine, MedicationManagement, MedicationInteractions (try warfarin + aspirin), dose reminders/adherence."),
 ("emulator-5558","vitals-chat-export","VIT","Vitals tab, AddVital (BP, glucose, weight, edge values), DailyVitalsLog, Analytics dashboard, ChatBot tab, Export report."),
]
procs=[]
for dev, area, pre, scope in areas:
    d = pathlib.Path(area); (d/'verify-shots').mkdir(parents=True, exist_ok=True)
    p = tpl.replace('{{DEVICE}}',dev).replace('{{AREA}}',area).replace('{{PREFIX}}',pre).replace('{{SCOPE}}',scope)
    log = open(d/'sol-agent.log','w',encoding='utf-8')
    procs.append(subprocess.Popen([CODEX,'exec','-m','gpt-6.1-sol','-s','danger-full-access','--skip-git-repo-check','-C','..','-o',f'qa/{area}/sol-final.txt','-'], stdin=subprocess.PIPE, stdout=log, stderr=subprocess.STDOUT, cwd='.'))
    procs[-1].stdin.write(p.encode('utf-8')); procs[-1].stdin.close()
for pr in procs: pr.wait()
print([pr.returncode for pr in procs])
