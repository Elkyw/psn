const dgram = require('dgram');
const dnsPacket = require('dns-packet');
const fs = require('fs');
const path = require('path');

const server = dgram.createSocket('udp4');
const dbPath = path.join(__dirname, 'db.json');

let db = {};

// Load the DNS records from db.json
function loadDatabase() {
    try {
        const data = fs.readFileSync(dbPath, 'utf8');
        db = JSON.parse(data);
        console.log('Database loaded successfully.');
    } catch (err) {
        console.error('Error loading database:', err);
    }
}

// Initialize the database
loadDatabase();

server.on('message', (msg, rinfo) => {
    const incomingReq = dnsPacket.decode(msg);
    const requestedName = incomingReq.questions[0].name;

    // Log the DNS formatted URL
    console.log(`DNS query received for: ${requestedName}`);

    const ipFromDb = db[requestedName];

    const ans = dnsPacket.encode({
        type: 'response',
        id: incomingReq.id,
        flags: dnsPacket.AUTHORITATIVE_ANSWER,
        questions: incomingReq.questions,
        answers: [{
            type: 'A',
            class: 'IN',
            name: requestedName,
            ttl: 300,
            data: ipFromDb ? ipFromDb.data : '0.0.0.0' // Check if entry exists in db
        }]
    });

    server.send(ans, 0, ans.length, rinfo.port, rinfo.address, (err) => {
        if (err) {
            console.error('Error sending response:', err);
        }
    });
});

server.on('error', (err) => {
    console.error('Server error:', err);
});

server.bind(53, () => {
    console.log('DNS server is running on port 53');
});
