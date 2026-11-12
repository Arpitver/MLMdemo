# NetPro MLM Software — Client Demo

A browser-only prototype for exploring member dashboards, binary placement, sample wallet activity, and simulated plan tracking. It uses plain HTML, CSS, and JavaScript with no build step or package installation.

> **Demo only:** This project does not accept or transfer real money, process bank payouts, or make investments. Commissions, balances, plan rates, and maturity credits are illustrative simulations, not guarantees, financial advice, or an offer. Do not enter real personal, banking, or password information. This front-end prototype is not suitable for production.

## Run locally

1. Open this folder in VS Code.
2. Start a local static web server (such as the Live Server extension) and open `index.html`.
3. Use a demo account below. The one-time sign-in code is displayed on screen.

The app uses the Web Crypto API, so open it through a local server rather than directly as a `file:` URL.

## Demo accounts

| Role | ID | Password |
|---|---|---|
| Admin | `admin` | `admin123` |
| Member | `NP1002` | `1234` |
| Seeded members | `NP1003`, `NP1005` | `1234` |

## Features

- Binary tree placement, six sample packages, member registration, and simulated direct / binary / level commissions
- Member ranks, local wallet ledger, demo transfers, and admin-reviewed sample withdrawal requests
- 30 / 60 / 90-day simulated plans, demo wallet top-ups, and a `+10 days` control
- Notice board, profile editing, account blocking, audit history, password hashing demo, OTP demo, and idle sign-out

## Data and limitations

Data is stored in this browser's `localStorage` under `npmlm2`. Use **Reset** on the sign-in screen to restore the seed accounts. The bundled bank values are synthetic placeholders; no payout is sent.

Client-side storage, hashing, OTP display, and access controls are demonstrations only and are not security boundaries. There is no backend, real OTP delivery, payment integration, or bank connection. A production system would require properly secured server-side authentication and validation, real service integrations, and qualified legal and security review. Investment products and referral compensation may be subject to local laws.

## Files

- `index.html` — app shell
- `css/style.css` — styling and responsive layout
- `js/app.js` — demo data, commission simulation, and interface logic
- `standalone.html` — single-file version of the demo
