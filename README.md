# NetPro MLM Software — Client Demo

A browser-only interface prototype for exploring a binary-plan network marketing dashboard. It uses plain HTML, CSS, and JavaScript; there is no package installation or build step.

> **Demo only:** Accounts, commissions, wallet balances, withdrawals, and investment plans are simulated in this browser. No real money is accepted, sent, invested, or paid out. The displayed rates are illustrative and are not guarantees, financial advice, or an offer. This project is not suitable for production use.

## Run locally

1. Open this folder in VS Code.
2. Start a local static web server (for example, with the Live Server extension), then open `index.html`.
3. Use one of the demo accounts below. The six-digit sign-in code is shown on screen.

Opening through a local web server is required for browser SHA-256 support.

## Demo accounts

| Role | ID | Password |
|---|---|---|
| Admin | `admin` | `admin123` |
| Member | `NP1002` | `1234` |
| Seeded members | `NP1003`, `NP1005` | `1234` |

## Included demo features

- Binary placement tree, member registration, packages, and seeded team accounts
- Simulated 10% direct, binary matching, and level 2 / level 3 commissions (2% / 1%)
- Member ranks, local wallet ledger, transfers, and admin-reviewed withdrawal requests
- 30 / 60 / 90-day simulated plans, demo add-funds action, and a `+10 demo days` control
- Notice board, profile editing, account blocking, password change, and audit history
- SHA-256 password hashes, one-time demo code, three-attempt 30-second lockout, and 15-minute idle sign-out

## Data and limitations

Data is stored in this browser's `localStorage` under `npmlm2`. Use **Reset demo data** on the sign-in screen to restore the seed accounts. A new browser or cleared site data starts with fresh demo data.

This front-end prototype has no server, authoritative authentication, real OTP delivery, payment gateway, or bank integration. Client-side controls can be altered and are not a security boundary. Do not enter real personal, financial, or password information. Before any real-world use, obtain qualified legal and security review and build appropriate server-side systems.

## Files

- `index.html` — app shell
- `css/style.css` — layout and styling
- `js/app.js` — demo data, login flow, and interface logic
