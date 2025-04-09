const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

let dbConnection; // Globale Variable für die Verbindung

// DB-Verbindung initialisieren (nur einmal)
const createDBConnection = async () => {
    try {
        dbConnection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT
        });

        console.log("✅ Erfolgreich mit der Datenbank verbunden!");
        return dbConnection;
    } catch (error) {
        console.error("❌ Fehler bei der DB-Verbindung:", error.message);
        process.exit(1);
    }
};

// Funktion zum Speichern eines Projekts
const saveProject = async (projectData) => {
    const { title, description, imgUrl, techUsed, githubUrl, liveDemoLink } = projectData;

    console.log("Projekt Daten:", projectData); 

    // MySQL-Query vorbereiten
    const query = `
        INSERT INTO projects (title, description, image_url, tech_used, github_rep_link, live_demo_link)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    try {
        const dbConnection = await createDBConnection();  // Hol die globale DB-Verbindung
        const [result] = await dbConnection.execute(query, [title, description, imgUrl, techUsed, githubUrl, liveDemoLink]);

        console.log("✅ Projekt erfolgreich gespeichert, ID:", result.insertId);
        return { success: true, insertId: result.insertId };
    } catch (error) {
        console.error("❌ Fehler beim Speichern des Projekts:", error.message);
        return { success: false, error: error.message };
    }
};

async function getProjects(searchTerm) {
    const dbConnection = await createDBConnection();
    
    if (!dbConnection) {
        console.error("❌ Keine gültige DB-Verbindung");
        return [];
    }

    const query = 'SELECT * FROM projects WHERE title LIKE ?';
    try {
        const [results] = await dbConnection.execute(query, [`%${searchTerm}%`]);
        return results;
    } catch (error) {
        console.error("❌ Fehler bei der Abfrage:", error.message);
        return [];
    }
}

// Projekt aktualisieren
async function updateProject(projectId, updatedProject) {
    const { title, description, imgUrl, techUsed, githubUrl, liveDemoLink } = updatedProject;

    const query = `
        UPDATE projects 
        SET title = ?, description = ?, image_url = ?, tech_used = ?, github_rep_link = ?, live_demo_link = ? 
        WHERE id = ?
    `;
    const values = [title, description, imgUrl, techUsed, githubUrl, liveDemoLink, projectId];

    try {
        const dbConnection = await createDBConnection(); // Hol die globale DB-Verbindung
        const [result] = await dbConnection.execute(query, values);
        return result;
    } catch (error) {
        console.error("❌ Fehler beim Aktualisieren des Projekts:", error.message);
        throw error; // Fehler weitergeben, um ihn im Aufrufer zu behandeln
    }
}

// Projekt löschen
async function deleteProject(projectId) {
    const query = `
        DELETE FROM projects 
        WHERE id = ?
    `;
    
    try {
        const dbConnection = await createDBConnection(); // Hol die globale DB-Verbindung
        const [result] = await dbConnection.execute(query, [projectId]);

        if (result.affectedRows > 0) {
            console.log(`✅ Projekt mit ID ${projectId} erfolgreich gelöscht.`);
            return { success: true };
        } else {
            console.log(`❌ Kein Projekt mit ID ${projectId} gefunden.`);
            return { success: false, message: 'Projekt nicht gefunden.' };
        }
    } catch (error) {
        console.error("❌ Fehler beim Löschen des Projekts:", error.message);
        throw error; // Fehler weitergeben, um ihn im Aufrufer zu behandeln
    }
}


module.exports = { 
    saveProject, 
    updateProject,
    getProjects,
    deleteProject
};