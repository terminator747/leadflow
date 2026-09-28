# Troubleshooting

## `MongooseServerSelectionError`

Usually Atlas network access or credentials.

Go to Atlas:
Security → Network Access → IP Access List

Add your current IP.

## `bad auth : authentication failed`

The database username/password is wrong, or the password contains an unencoded special character.

Reset the database user's password from:
Security → Database Access → Edit

Then update `server/.env`.

## `EADDRINUSE`

Port 5000 or 5173 is already in use.

Close the old Node/Vite terminal or change the port.

## Frontend says Network Error

Make sure the backend terminal is running:

```bash
cd server
npm run dev
```

Then test:

`http://localhost:5000/health`

## Login fails after changing MongoDB

Run the seed again:

```bash
cd server
npm run seed
```

This resets the demo database data.

## Do not commit `.env`

The root `.gitignore` already ignores environment files.


## `querySrv ECONNREFUSED _mongodb._tcp.cluster0.fxblzjz.mongodb.net`

This is a DNS lookup problem, not a MongoDB password error. The Atlas hostname is being parsed, but the DNS resolver on the machine is refusing the SRV query.

The updated project now asks Node to use Cloudflare DNS (`1.1.1.1`) and Google DNS (`8.8.8.8`) for Atlas SRV lookups.

If it still happens:

1. Disconnect any VPN/proxy temporarily.
2. In PowerShell run:
   ```powershell
   nslookup -type=SRV _mongodb._tcp.cluster0.fxblzjz.mongodb.net
   ```
3. If it says `REFUSED`, `SERVFAIL`, or times out, change the Windows network adapter DNS to:
   - Preferred: `1.1.1.1`
   - Alternate: `8.8.8.8`
4. Restart VS Code and run:
   ```powershell
   cd server
   npm run dev
   ```

## `React is not defined`

The frontend was missing the Vite React plugin configuration. The updated ZIP contains `client/vite.config.js` and an explicit React import in `App.jsx`.

Restart the Vite server after replacing the project:

```bash
cd client
npm run dev
```
