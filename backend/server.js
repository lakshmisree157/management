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
const collectionsFilePath = path.join(__dirname, 'data', 'collections.json');

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

// Read collections data
const getCollectionsData = () => {
    try {
        const data = fs.readFileSync(collectionsFilePath);
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading collections:', error);
        return { collections: [] };
    }
};

// Save collections data
const saveCollectionsData = (data) => {
    try {
        fs.writeFileSync(collectionsFilePath, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error saving collections:', error);
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

// API endpoints for collections
// Update the collections POST endpoint
app.post('/api/collections', (req, res) => {
    try {
        const { username, reusableItems, nonReusableItems } = req.body;
        
        // Filter out zero values
        const filteredReusable = Object.fromEntries(
            Object.entries(reusableItems)
                .filter(([_, value]) => parseInt(value) > 0)
        );

        const filteredNonReusable = Object.fromEntries(
            Object.entries(nonReusableItems)
                .filter(([_, value]) => parseInt(value) > 0)
        );

        const collections = getCollectionsData();
        
        const newCollection = {
            id: Date.now().toString(),
            username,
            timestamp: new Date().toISOString(),
            reusableItems: filteredReusable,
            nonReusableItems: filteredNonReusable
        };
        
        collections.collections.push(newCollection);
        saveCollectionsData(collections);
        
        res.status(201).json({ 
            message: 'Collection saved successfully',
            collection: newCollection 
        });
    } catch (error) {
        console.error('Error saving collection:', error);
        res.status(500).json({ error: 'Failed to save collection' });
    }
});

app.get('/api/collections/:username', (req, res) => {
    try {
        const { username } = req.params;
        const collections = getCollectionsData();
        
        const userCollections = collections.collections.filter(c => c.username === username);
        res.json(userCollections);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch collections' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});