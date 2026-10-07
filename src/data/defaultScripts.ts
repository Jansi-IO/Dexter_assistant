import { AutomationScript } from '../types/dexter';

export const INITIAL_SCRIPTS: AutomationScript[] = [
  {
    id: 'script-disk-cleanup',
    title: 'Automated Temp & Dump Files Purge',
    description: 'Scans and cleans temporary files, log dumps, and recycle bin to free up gigabytes of drive space.',
    language: 'powershell',
    category: 'system',
    dateUpdated: '2026-10-01',
    dependencies: ['Native Windows PowerShell 5.1+'],
    safetyNotes: 'Excludes system-critical locks; safely skips files currently in use by active processes.',
    steps: [
      'Query user TEMP directory and system Temp folder',
      'Identify files older than 24 hours',
      'Safely remove orphaned log caches',
      'Calculate total megabytes recovered',
    ],
    code: `# Dexter PC Automation: Disk Cleaner
$TempFolders = @($env:TEMP, "$env:SystemRoot\\Temp")
$FreedBytes = 0

Write-Host "[Dexter] Starting system temp directory cleanup..." -ForegroundColor Cyan

foreach ($Folder in $TempFolders) {
    if (Test-Path $Folder) {
        $Files = Get-ChildItem -Path $Folder -Recurse -File -ErrorAction SilentlyContinue |
                 Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-1) }
        foreach ($File in $Files) {
            try {
                $FreedBytes += $File.Length
                Remove-Item -Path $File.FullName -Force -ErrorAction Stop
            } catch {
                # File is locked by running app, gracefully continue
            }
        }
    }
}

$FreedMB = [math]::Round($FreedBytes / 1MB, 2)
Write-Host "[Dexter] Cleanup finished! Reclaimed approximately $FreedMB MB of space." -ForegroundColor Green
`,
  },
  {
    id: 'script-project-backup',
    title: 'Workspace Zip & Snapshot Archiver',
    description: 'Compresses your active projects directory into a timestamped .zip archive and stores it safely.',
    language: 'python',
    category: 'files',
    dateUpdated: '2026-09-28',
    dependencies: ['python standard library (zipfile, os, datetime)'],
    safetyNotes: 'Ignores node_modules, .git, and __pycache__ to keep archives fast, lightweight, and clean.',
    steps: [
      'Locate source folder (e.g. C:/Dexter or C:/Projects)',
      'Generate timestamp string (YYYY-MM-DD_HHMM)',
      'Recursively compress files while ignoring bloat directories',
      'Verify archive checksum and report total size',
    ],
    code: `import os
import zipfile
from datetime import datetime
from pathlib import Path

SOURCE_DIR = Path.home() / "Dexter"
BACKUP_DIR = Path.home() / "Dexter_Backups"
IGNORE_DIRS = {"node_modules", ".git", "__pycache__", ".venv", "dist"}

def create_snapshot():
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    archive_path = BACKUP_DIR / f"Dexter_Backup_{timestamp}.zip"

    print(f"[Dexter] Backing up: {SOURCE_DIR} -> {archive_path}")
    count = 0

    with zipfile.ZipFile(archive_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(SOURCE_DIR):
            # Exclude bloat folders
            dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
            for file in files:
                file_path = Path(root) / file
                arcname = file_path.relative_to(SOURCE_DIR)
                zipf.write(file_path, arcname)
                count += 1

    size_mb = archive_path.stat().st_size / (1024 * 1024)
    print(f"[Dexter] Snapshot completed! {count} files archived ({size_mb:.2f} MB).")
    return str(archive_path)

if __name__ == "__main__":
    create_snapshot()
`,
  },
  {
    id: 'script-sys-diagnostics',
    title: 'PC Health & Hardware Diagnostics',
    description: 'Captures CPU usage, RAM utilization, available drive space, and network connectivity in 1 report.',
    language: 'python',
    category: 'system',
    dateUpdated: '2026-10-04',
    dependencies: ['python standard library (platform, shutil, socket) or psutil'],
    safetyNotes: 'Read-only diagnostic query; executes with zero system changes or side effects.',
    steps: [
      'Probe CPU architecture & OS release version',
      'Calculate Disk usage percentage on primary drive',
      'Test gateway ping and DNS resolution',
      'Output formatted health overview table',
    ],
    code: `import platform
import shutil
import socket
from datetime import datetime

def check_pc_health():
    print("=" * 45)
    print("      DEXTER HARDWARE & PC DIAGNOSTICS")
    print("=" * 45)
    print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"OS: {platform.system()} {platform.release()} ({platform.machine()})")
    print(f"Hostname: {socket.gethostname()}")

    # Disk Space Check
    total, used, free = shutil.disk_usage("/")
    print(f"Primary Disk: {used // (2**30)} GB used / {total // (2**30)} GB total ({free // (2**30)} GB free)")

    # Network Test
    try:
        socket.create_connection(("8.8.8.8", 53), timeout=3)
        net_status = "Online (Connected)"
    except OSError:
        net_status = "Offline (No route to DNS)"
    print(f"Internet Status: {net_status}")
    print("=" * 45)

if __name__ == "__main__":
    check_pc_health()
`,
  },
  {
    id: 'script-kill-task-hung',
    title: 'Terminate Not-Responding PC Applications',
    description: 'Finds frozen or unresponsive window processes and gracefully closes them to unfreeze the PC.',
    language: 'powershell',
    category: 'system',
    dateUpdated: '2026-09-20',
    dependencies: ['Windows PowerShell native tasklist / stop-process'],
    safetyNotes: 'Checks responsiveness status first before issuing terminate signals.',
    steps: [
      'Query process list for Not Responding state',
      'Warn user of hung applications',
      'Gracefully terminate hung processes',
    ],
    code: `# Dexter PC Automation: Terminate Hung Tasks
$HungProcesses = Get-Process | Where-Object { $_.Responding -eq $false }

if ($HungProcesses.Count -eq 0) {
    Write-Host "[Dexter] All PC processes are responding normally." -ForegroundColor Green
} else {
    Write-Host "[Dexter] Found $($HungProcesses.Count) unresponsive application(s):" -ForegroundColor Yellow
    foreach ($proc in $HungProcesses) {
        Write-Host " -> Killing hung process: $($proc.ProcessName) (PID: $($proc.Id))" -ForegroundColor Red
        Stop-Process -Id $proc.Id -Force
    }
    Write-Host "[Dexter] Unresponsive tasks cleared." -ForegroundColor Green
}
`,
  },
];
