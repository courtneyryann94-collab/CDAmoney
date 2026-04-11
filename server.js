const express = require('express');
const session = require('express-session');
const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'LoanApp2026!';
const SESSION_SECRET = process.env.SESSION_SECRET || 'change-this-secret';
const DATA_DIR = path.join(__dirname, 'data');
const APPLICATIONS_FILE = path.join(DATA_DIR, 'applications.json');
const INVESTOR_APPLICATIONS_FILE = path.join(DATA_DIR, 'investor-applications.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(
    session({
        secret: SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            sameSite: 'strict',
            secure: false,
        },
    })
);

function requireAuth(req, res, next) {
    if (req.session && req.session.authenticated) {
        return next();
    }
    res.status(401).redirect('/login');
}

async function ensureDataFile() {
    await fs.mkdir(DATA_DIR, { recursive: true });
    try {
        await fs.access(APPLICATIONS_FILE);
    } catch {
        await fs.writeFile(APPLICATIONS_FILE, '[]', 'utf8');
    }
    try {
        await fs.access(INVESTOR_APPLICATIONS_FILE);
    } catch {
        await fs.writeFile(INVESTOR_APPLICATIONS_FILE, '[]', 'utf8');
    }
    try {
        await fs.access(USERS_FILE);
    } catch {
        await fs.writeFile(USERS_FILE, '[]', 'utf8');
    }
}

function hashPassword(password, salt = null) {
    const finalSalt = salt || crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, finalSalt, 310000, 32, 'sha256').toString('hex');
    return { salt: finalSalt, hash };
}

function verifyPassword(password, user) {
    if (!user || !user.salt || !user.hash) {
        return false;
    }
    const { hash } = hashPassword(password, user.salt);
    return hash === user.hash;
}

function createUserObject(username, password) {
    const { salt, hash } = hashPassword(password);
    return {
        id: crypto.randomUUID(),
        username,
        salt,
        hash,
        createdAt: new Date().toISOString(),
    };
}

async function readApplications() {
    await ensureDataFile();
    const contents = await fs.readFile(APPLICATIONS_FILE, 'utf8');
    return JSON.parse(contents || '[]');
}

async function writeApplications(applications) {
    await ensureDataFile();
    await fs.writeFile(APPLICATIONS_FILE, JSON.stringify(applications, null, 2), 'utf8');
}

async function readInvestorApplications() {
    await ensureDataFile();
    const contents = await fs.readFile(INVESTOR_APPLICATIONS_FILE, 'utf8');
    return JSON.parse(contents || '[]');
}

async function writeInvestorApplications(applications) {
    await ensureDataFile();
    await fs.writeFile(INVESTOR_APPLICATIONS_FILE, JSON.stringify(applications, null, 2), 'utf8');
}

async function readUsers() {
    await ensureDataFile();
    const contents = await fs.readFile(USERS_FILE, 'utf8');
    const users = JSON.parse(contents || '[]');

    if (!Array.isArray(users) || users.length === 0) {
        const adminUser = createUserObject(ADMIN_USERNAME, ADMIN_PASSWORD);
        await writeUsers([adminUser]);
        return [adminUser];
    }

    return users;
}

async function writeUsers(users) {
    await ensureDataFile();
    await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
}

app.post('/api/loan-application', async (req, res) => {
    const { loanType, fullName, email, phone, details } = req.body;

    if (!loanType || !fullName || !email || !phone) {
        return res.status(400).json({ error: 'Please complete all required fields.' });
    }

    const application = {
        id: Date.now().toString(),
        loanType,
        fullName,
        email,
        phone,
        details: details || '',
        createdAt: new Date().toISOString(),
    };

    try {
        const applications = await readApplications();
        applications.push(application);
        await writeApplications(applications);
        console.log('Loan application saved:', application.id, application.fullName);
        return res.status(201).json({ success: true, applicationId: application.id });
    } catch (error) {
        console.error('Failed to save loan application:', error);
        return res.status(500).json({ error: 'Unable to save application at this time.' });
    }
});

app.post('/api/investor-application', async (req, res) => {
    const { investorName, company, email, phone, details } = req.body;

    if (!investorName || !email || !phone) {
        return res.status(400).json({ error: 'Please complete all required fields.' });
    }

    const application = {
        id: Date.now().toString(),
        investorName,
        company: company || '',
        email,
        phone,
        details: details || '',
        createdAt: new Date().toISOString(),
    };

    try {
        const applications = await readInvestorApplications();
        applications.push(application);
        await writeInvestorApplications(applications);
        console.log('Investor application saved:', application.id, application.investorName);
        return res.status(201).json({ success: true, applicationId: application.id });
    } catch (error) {
        console.error('Failed to save investor application:', error);
        return res.status(500).json({ error: 'Unable to save investor application at this time.' });
    }
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const users = await readUsers();
    const user = users.find((entry) => entry.username === username);

    if (user && verifyPassword(password, user)) {
        req.session.authenticated = true;
        req.session.username = username;
        return res.redirect('/admin');
    }

    res.redirect('/login?error=1');
});

app.post('/api/users', requireAuth, async (req, res) => {
    const { username, password } = req.body;
    const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';

    // Only allow admin to create new users
    if (req.session.username !== ADMIN_USERNAME) {
        return res.status(403).json({ error: 'Only admin can create new employee accounts.' });
    }

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required.' });
    }

    const users = await readUsers();
    if (users.some((user) => user.username === username)) {
        return res.status(409).json({ error: 'That username is already taken.' });
    }

    const newUser = createUserObject(username, password);
    users.push(newUser);
    await writeUsers(users);

    return res.status(201).json({ success: true, username: newUser.username });
});

app.get('/api/current-user', requireAuth, async (req, res) => {
    const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
    return res.json({
        username: req.session.username,
        isAdmin: req.session.username === ADMIN_USERNAME
    });
});

app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login');
    });
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/admin', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

app.get('/api/applications', requireAuth, async (req, res) => {
    try {
        const applications = await readApplications();
        res.json(applications);
    } catch (error) {
        console.error('Failed to load applications:', error);
        res.status(500).json({ error: 'Unable to load applications.' });
    }
});

app.delete('/api/applications/:id', requireAuth, async (req, res) => {
    const applicationId = req.params.id;
    try {
        const applications = await readApplications();
        const filtered = applications.filter((app) => app.id !== applicationId);
        if (filtered.length === applications.length) {
            return res.status(404).json({ error: 'Application not found.' });
        }
        await writeApplications(filtered);
        console.log('Loan application deleted:', applicationId);
        res.json({ success: true });
    } catch (error) {
        console.error('Failed to delete application:', error);
        res.status(500).json({ error: 'Unable to delete application.' });
    }
});

app.delete('/api/investor-applications/:id', requireAuth, async (req, res) => {
    const applicationId = req.params.id;
    try {
        const applications = await readInvestorApplications();
        const filtered = applications.filter((app) => app.id !== applicationId);
        if (filtered.length === applications.length) {
            return res.status(404).json({ error: 'Investor contact not found.' });
        }
        await writeInvestorApplications(filtered);
        console.log('Investor contact deleted:', applicationId);
        res.json({ success: true });
    } catch (error) {
        console.error('Failed to delete investor contact:', error);
        res.status(500).json({ error: 'Unable to delete investor contact.' });
    }
});

app.get('/api/investor-applications', requireAuth, async (req, res) => {
    try {
        const applications = await readInvestorApplications();
        res.json(applications);
    } catch (error) {
        console.error('Failed to load investor applications:', error);
        res.status(500).json({ error: 'Unable to load investor applications.' });
    }
});

app.use(express.static(path.join(__dirname)));

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});