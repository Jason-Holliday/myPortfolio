const dotenv = require('dotenv');
const { Pool } = require('pg');


dotenv.config();

let dbPool; // Pool für die Verbindung

// DB-Verbindung initialisieren (nur einmal)
const createDBConnection = () => {
    try {
        // Pool für PostgreSQL-Verbindung
        if (!dbPool) {
            dbPool = new Pool({
                user: process.env.DB_USER,
                host: process.env.DB_HOST,
                database: process.env.DB_NAME,
                password: process.env.DB_PASSWORD,
                port: process.env.DB_PORT || 5432, // Standardport für PostgreSQL
            });

            console.log("✅ Erfolgreich mit der PostgreSQL-Datenbank verbunden!");
        }

        return dbPool;  // Pool statt dbConnection zurückgeben
    } catch (error) {
        console.error("❌ Fehler bei der DB-Verbindung:", error.message);
        process.exit(1); // Beendet das Programm im Falle eines Fehlers
    }
};

// Funktion zum Speichern eines Projekts
const saveProject = async (projectData) => {
    const { title, description, imgUrl, techUsed, githubUrl, liveDemoLink } = projectData;

    console.log("Projekt Daten:", projectData); 

    // PostgreSQL-Query vorbereiten
    const query = `
        INSERT INTO projects (title, description, image_url, tech_used, github_rep_link, live_demo_link)
        VALUES ($1, $2, $3, $4, $5, $6) RETURNING id
    `;

    try {
        const dbConnection = createDBConnection();  // Hol die DB-Verbindung
        const { rows } = await dbConnection.query(query, [title, description, imgUrl, techUsed, githubUrl, liveDemoLink]);

        console.log("✅ Projekt erfolgreich gespeichert, ID:", rows[0].id);
        return { success: true, insertId: rows[0].id };
    } catch (error) {
        console.error("❌ Fehler beim Speichern des Projekts:", error.message);
        return { success: false, error: error.message };
    }
};

// Projekte abfragen
async function getProjects(searchTerm) {
    const dbConnection = createDBConnection();

    const query = 'SELECT * FROM projects WHERE title ILIKE $1'; // ILIKE ist case-insensitive in PostgreSQL
    try {
        const { rows } = await dbConnection.query(query, [`%${searchTerm}%`]);
        return rows;
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
        SET title = $1, description = $2, image_url = $3, tech_used = $4, github_rep_link = $5, live_demo_link = $6 
        WHERE id = $7
    `;
    const values = [title, description, imgUrl, techUsed, githubUrl, liveDemoLink, projectId];

    try {
        const dbConnection = createDBConnection();
        const { rowCount } = await dbConnection.query(query, values);
        return rowCount;
    } catch (error) {
        console.error("❌ Fehler beim Aktualisieren des Projekts:", error.message);
        throw error;
    }
}

// Projekt löschen
async function deleteProject(projectId) {
    const query = `
        DELETE FROM projects 
        WHERE id = $1
    `;
    
    try {
        const dbConnection = createDBConnection();
        const { rowCount } = await dbConnection.query(query, [projectId]);

        if (rowCount > 0) {
            console.log(`✅ Projekt mit ID ${projectId} erfolgreich gelöscht.`);
            return { success: true };
        } else {
            console.log(`❌ Kein Projekt mit ID ${projectId} gefunden.`);
            return { success: false, message: 'Projekt nicht gefunden.' };
        }
    } catch (error) {
        console.error("❌ Fehler beim Löschen des Projekts:", error.message);
        throw error;
    }
}


module.exports = { 
    saveProject, 
    updateProject,
    getProjects,
    deleteProject
};