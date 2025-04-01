const express = require('express');
const multer = require('multer');
const dotenv = require('dotenv');
const nodemailer = require('nodemailer');
const cors = require('cors');
const { uploadImage } = require('./cloudinary'); // Import der Cloudinary-Funktion
const { saveProject, updateProject, getProjects, deleteProject } = require('./db'); // Import der Datenbank-Funktionen

// Lade Umgebungsvariablen aus der .env-Datei
dotenv.config();

const app = express(); // Erstellt den Express-Server

// CORS-Konfiguration
const corsOptions = {
    origin: ['https://jasonholliday.dev', 'https://www.jasonholliday.dev'], // Erlaube nur Anfragen von deiner Domain
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Erlaubte Methoden
};

// Middleware für CORS und statische Dateien
app.use(cors(corsOptions));  // CORS mit der richtigen Konfiguration
app.use(express.static('public')); // Stellt Dateien aus dem 'public'-Ordner bereit


// Middleware zum Parsen von URL-codierten Daten (für FormData)
app.use(express.urlencoded({ extended: true }));  // Hinzugefügt, um FormData zu unterstützen
app.use(express.json()); // Middleware zum Parsen von JSON-Daten

// E-Mail senden
app.post("/send-email", async (req, res) => {
    const { email, firstName, lastName, message } = req.body;

    if (!email || !firstName || !lastName || !message) {
        return res.status(400).json({ error: "Alle Felder sind erforderlich!" });
    }

    try {
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: false, // true für 465, false für andere Ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        const mailOptions = {
            from: process.env.RECEIVER_EMAIL,
            to: process.env.RECEIVER_EMAIL,
            subject: `📩 Rückmeldung zur Bewerbung von  (${email})`,
            text: `Absender: ${email}\n\nNachricht:\n${message}`,
            html: `
                    <h2>Neue Nachricht</h2>
                    <p><strong>Von:</strong> ${firstName} ${lastName} (${email})</p>
                    <p><strong>Nachricht:</strong></p>
                    <p>${message}</p>
            `,
            replyTo: email
        };

        const info = await transporter.sendMail(mailOptions);
        console.log("E-Mail gesendet:", info.response);

        res.json({ success: true, message: "E-Mail erfolgreich gesendet!" });
    } catch (error) {
        console.error("Fehler beim Senden der E-Mail:", error);
        res.status(500).json({ error: "Fehler beim Senden der E-Mail" });
    }
});

// Middleware zum Hochladen von Bildern
const upload = multer();

// Route zum Hochladen von Bildern
app.post('/upload', upload.single('image'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'Kein Bild hochgeladen!' });
    }

    const folder = 'portfolio/img'; // Zielordner für das Bild

    try {
        const secureUrl = await uploadImage(req.file.buffer, folder);
        res.json({ secure_url: secureUrl });
    } catch (error) {
        console.error('Fehler beim Hochladen:', error);
        res.status(500).json({ message: 'Fehler beim Hochladen des Bildes', error: error.message });
    }
});


app.get('/admin', (req, res) => {
    res.sendFile(__dirname + '/public/admin/admin.html');
});



// Route zum Abrufen der Projekte
app.get('/projects', async (req, res) => {
    try {
        const searchTerm = req.query.search || ''; // Falls kein Suchbegriff vorhanden, leere Zeichenkette
        const projects = await getProjects(searchTerm);
        res.json(projects);
    } catch (error) {
        console.error('Fehler beim Abrufen der Projekte:', error);
        res.status(500).json({ message: 'Fehler beim Abrufen der Projekte', error: error.message });
    }
});

// Route zum Speichern eines Projekts
app.post('/save-project', async (req, res) => {
    try {
        const projectData = req.body;
        const results = await saveProject(projectData);
        res.status(201).json({ message: 'Projekt erfolgreich gespeichert', projectId: results.insertId });
    } catch (error) {
        console.error('Fehler beim Speichern des Projekts:', error);
        res.status(500).json({ message: 'Fehler beim Speichern des Projekts', error: error.message });
    }
});

// Route zum Aktualisieren eines Projekts
app.put('/projects/:id', async (req, res) => {
    const { id } = req.params;
    const updatedProject = req.body;

    try {
        await updateProject(id, updatedProject);
        res.json({ message: "Projekt erfolgreich aktualisiert!" });
    } catch (error) {
        console.error('Fehler beim Aktualisieren des Projekts:', error);
        res.status(500).json({ message: "Fehler beim Aktualisieren des Projekts", error: error.message });
    }
});

// Route zum Löschen eines Projekts
app.delete('/projects/:id', async (req, res) => {
    const projectId = req.params.id;

    try {
        const result = await deleteProject(projectId);
        if (result.success) {
            res.json({ message: 'Projekt erfolgreich gelöscht.' });
        } else {
            res.status(404).json({ message: result.message });
        }
    } catch (error) {
        console.error('Fehler beim Löschen des Projekts:', error);
        res.status(500).json({ message: 'Fehler beim Löschen des Projekts.' });
    }
});

// Standard-Route, um sicherzustellen, dass der Server läuft
app.get("/", (req, res) => {
    res.send("Server läuft!");
});

// Definiere den HOST und PORT
const port = process.env.PORT || 3000; 

// Server starten
app.listen(port, "0.0.0.0", function () {
    console.log(`Server läuft auf Port ${port}`);
});
