================================================================================
OFFLINE CBT SYSTEM – MULTI‑PC LAN DEPLOYMENT GUIDE
================================================================================

This guide explains how to run the CBT system on a local network (no internet).
One computer acts as the server; students connect using its IP address.

================================================================================
PREREQUISITES ON THE SERVER PC (Windows)
================================================================================

- Node.js (v18 or later) installed
- The CBT system folder (cbt-system-full) placed on the Desktop
- Backend and frontend dependencies already installed (npm install done)
- The server PC must have a static IP address on your LAN (see section below)

================================================================================
STEP 1 – SET A STATIC IP ADDRESS ON THE SERVER PC (Important)
================================================================================

1. Press Win + R, type "ncpa.cpl" and press Enter.
2. Right‑click your active network adapter (Ethernet or Wi‑Fi) → Properties.
3. Select "Internet Protocol Version 4 (TCP/IPv4)" → Properties.
4. Choose "Use the following IP address" and enter:
   IP address: 192.168.1.100 (or any address not conflicting)
   Subnet mask: 255.255.255.0
   Default gateway: your router's IP (usually 192.168.1.1)
5. DNS servers: leave blank or use 8.8.8.8 (internet not required, but harmless).
6. Click OK.

Alternatively, assign a fixed IP via your router's DHCP reservation.

================================================================================
STEP 2 – START THE BACKEND ON THE SERVER
================================================================================
Open Command Prompt and run:

cd %USERPROFILE%\Desktop\cbt-system-full\backend
node server.js

You should see: "Backend running on port 5000". Keep this window open.

================================================================================
STEP 3 – START THE FRONTEND (accessible to all network devices)
================================================================================
Open another Command Prompt and run:

cd %USERPROFILE%\Desktop\cbt-system-full\frontend
npm run dev -- --host 0.0.0.0

You will see something like:
VITE v5.x ready
➜ Local: http://localhost:5173/
➜ Network: http://192.168.1.100:5173/

The "Network" address is what students will use.

================================================================================
STEP 4 – ALLOW FIREWALL ACCESS (if needed)
================================================================================
Windows Firewall may block incoming connections. Run these commands as Admin:

netsh advfirewall firewall add rule name="CBT Frontend" dir=in action=allow protocol=tcp localport=5173
netsh advfirewall firewall add rule name="CBT Backend" dir=in action=allow protocol=tcp localport=5000

================================================================================
STEP 5 – STUDENTS CONNECT FROM THEIR PCs
================================================================================
On each student's PC (no need to install anything), open a web browser and go to:

http://192.168.1.100:5173 (replace with your server's actual IP)

They can then log in with their student credentials and take exams. All data is stored centrally on the server.

================================================================================
WHAT STUDENTS SEE / CAN DO
================================================================================

- Login with email and password (created by admin)
- View available exams (start time must be in the past, end time in future)
- Take exam (timer, auto‑save, submit)
- View their results and past results
- They cannot retake an exam once submitted

================================================================================
ADMIN TASKS (from any PC on the same network)
================================================================================
Admin can also log in from any student PC using the admin account (admin@school.com / Admin123!). They can:

- Create exams and questions
- Manage users (students, lecturers)
- View all exams and edit/delete them
- Manage questions for each exam

Just open the same URL (http://192.168.1.100:5173) and login as admin.

================================================================================
TROUBLESHOOTING
================================================================================
Q: Students see "ERR_CONNECTION_REFUSED"
A: Ensure the server frontend is running with `--host 0.0.0.0`. Also check firewall rules.

Q: Login fails with 401
A: Ensure backend is running and the credentials are correct. Try logging in on the server PC first.

Q: Exam does not appear for students
A: Check that exam start time is in the past, end time in the future. Also ensure student role is correctly assigned.

Q: The frontend terminal shows "http proxy error: ECONNREFUSED"
A: Backend is not running or not on port 5000. Start backend first.

================================================================================
OPTIONAL: AUTO‑START ON BOOT (for server PC)
================================================================================
To avoid manual startup after a reboot, create a batch file `start_cbt.bat` on Desktop:

@echo off
cd /d %USERPROFILE%\Desktop\cbt-system-full\backend
start /B node server.js
timeout /t 3 /nobreak >nul
cd /d %USERPROFILE%\Desktop\cbt-system-full\frontend
start /B npm run dev -- --host 0.0.0.0

Then add this batch file to Windows Startup (shell:startup). The server will automatically launch the CBT system on boot.

================================================================================
SUMMARY
================================================================================

- Server PC: runs Node.js backend + frontend (accessible at http://server-ip:5173)
- Student PCs: only need a browser – no installation
- Entire system works offline (LAN only)
- All data is stored on the server (SQLite database)

# Now your school lab can conduct exams without internet.
