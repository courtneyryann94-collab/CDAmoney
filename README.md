# CDAmoney

Landing page for Private Money Coeur d'Alene with a secure backend for loan applications.

## Setup

1. Copy `.env.example` to `.env` and update credentials:

   ```bash
   copy .env.example .env
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the server:

   ```bash
   npm start
   ```

4. Open `http://local host:3000` in your browser.

## Access admin dashboard

- Go to: `http://localhost:3000/login`
- Use the credentials from your `.env` file.

New employee logins can be created from the admin dashboard after signing in.

## Notes

- Loan applications are stored in `data/applications.json`.
- The admin dashboard is protected by a simple session login.
- Change `SESSION_SECRET` before deploying to production.
