const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Serve static files from frontend directory
app.use(express.static(path.join(__dirname, '../frontend')));

// Root route to serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Handle other routes
app.get('/:page', (req, res) => {
    const page = req.params.page;
    res.sendFile(path.join(__dirname, '../frontend', `${page}.html`));
});

// Path to users.json
const usersFilePath = path.join(__dirname, 'data', 'users.json');

// Read users data
const getUsersData = () => {
    try {
        const data = fs.readFileSync(usersFilePath);
        return JSON.parse(data);
    } catch (error) {
        return { users: [] };
    }
};

// Write users data
const saveUsersData = (data) => {
    try {
        fs.writeFileSync(usersFilePath, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error saving users data:', error);
    }
};

// Test endpoint
app.get('/api/test', (req, res) => {
    res.json({ message: 'Server is working!' });
});

// Signup endpoint
app.post('/api/signup', (req, res) => {
    const { username, email, phone, password } = req.body;
    
    const data = getUsersData();
    
    // Check if user already exists
    if (data.users.find(user => user.username === username || user.email === email)) {
        return res.status(400).json({ error: 'User already exists' });
    }
    
    // Add new user
    data.users.push({
        username,
        email,
        phone,
        password // Note: In a real application, password should be hashed
    });
    
    saveUsersData(data);
    
    res.status(201).json({ message: 'User created successfully' });
});

// Login endpoint
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    
    const data = getUsersData();
    
    // Find user
    const user = data.users.find(u => u.username === username && u.password === password);
    
    if (user) {
        res.json({ success: true });
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});