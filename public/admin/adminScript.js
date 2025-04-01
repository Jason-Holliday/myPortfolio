document.addEventListener("DOMContentLoaded", function () {
    const tabs = document.querySelectorAll(".tab");
    const tabContents = document.querySelectorAll(".tab-content");

    // Wenn ein Tab geklickt wird, aktiviere den entsprechenden Inhalt
    tabs.forEach((tab, index) => {
        tab.addEventListener("click", () => {
            // Entferne die 'active' Klasse von allen Tabs und Inhalten
            tabs.forEach(t => t.classList.remove("active"));
            tabContents.forEach(tc => tc.classList.remove("active"));

            // Füge die 'active' Klasse dem angeklickten Tab und dem entsprechenden Inhalt hinzu
            tab.classList.add("active");
            tabContents[index].classList.add("active");
        });
    });

    const fileInput = document.getElementById("image-upload");
    const uploadBtn = document.getElementById("upload-btn");
    const statusText = document.getElementById("status");

    // Button aktivieren, wenn eine Datei ausgewählt wird
    fileInput.addEventListener("change", () => {
        uploadBtn.disabled = fileInput.files.length === 0;
    });

    // Upload-Prozess
    uploadBtn.addEventListener("click", async (event) => {
        event.preventDefault(); // Verhindert das Neuladen der Seite

        if (!fileInput.files.length) return alert("Bitte wähle eine Datei aus!");

        const formData = new FormData();
        formData.append("image", fileInput.files[0]);

        try {
            statusText.textContent = "Lade hoch...";
            uploadBtn.disabled = true;

            const response = await fetch("http://localhost:3000/upload", {
                method: "POST",
                body: formData,
            });

            const data = await response.json();
            if (data.secure_url) {
                statusText.innerHTML = `✅ Hochgeladen: <a href="${data.secure_url}" target="_blank">Bild ansehen</a>`;
                
                document.getElementById('img-url').value = data.secure_url;

                const previewImage = document.getElementById("image-preview");
                previewImage.src = data.secure_url;
                previewImage.style.display = "block";
            } else {
                throw new Error("Upload fehlgeschlagen!");
            }
        } catch (error) {
            statusText.textContent = "❌ Fehler beim Hochladen!";
            console.error(error);
        } finally {
            uploadBtn.disabled = false;
        }
    });

    // Projekt-Formular absenden
    document.getElementById("add-project-form").addEventListener("submit", async function (event) {
        event.preventDefault();

        const title = document.getElementById("title").value;
        const description = document.getElementById("description").value;
        const imgUrl = document.getElementById("img-url").value;
        const githubUrl = document.getElementById("github-url").value;
        const liveDemoLink = document.getElementById("live-demo-link").value;
        
        const techUsed = Array.from(document.querySelectorAll('input[name="tech"]:checked'))
                             .map(checkbox => checkbox.value)
                             .join(", ");

        // Überprüfen, ob alle Felder ausgefüllt sind
        if (!title || !description || !imgUrl || !githubUrl || !liveDemoLink || !techUsed) {
            alert("❌ Alle Felder müssen ausgefüllt werden!");
            return;
        }

        try {
            const response = await fetch("http://localhost:3000/save-project", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title, description, imgUrl, techUsed, githubUrl, liveDemoLink })
            });

            if (!response.ok) {
                const text = await response.text();
                console.error("Fehler bei der Anfrage:", text);
                throw new Error("Fehler bei der Anfrage");
            }

            const data = await response.json();
            if (data.message) {
                alert("✅ Projekt erfolgreich gespeichert!");
                event.target.reset();
                await searchProject(); 
            } else {
                throw new Error(data.error || "Unbekannter Fehler");
            }
        } catch (error) {
            alert("❌ Fehler beim Speichern: " + error.message);
            console.error(error);
        }
    });

    const searchInput = document.getElementById("search-project");

    if (searchInput) {
        searchInput.addEventListener("keydown", async function(event) {
            if (event.key === 'Enter') {
                await searchProject();
            }
        });
    }

    let projects = []; // Array zur Speicherung der Projekte

    async function searchProject() {
        const searchTerm = searchInput.value;

        // Überprüfen, ob ein Suchbegriff eingegeben wurde
        if (!searchTerm.trim()) {
            alert("❌ Bitte gib einen Suchbegriff ein.");
            return;
        }

        try {
            const response = await fetch(`http://localhost:3000/projects?search=${encodeURIComponent(searchTerm)}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                }
            });
            const fetchedProjects = await response.json();

            if (Array.isArray(fetchedProjects)) {
                projects = fetchedProjects; 
                displayProjects(projects);
            } else {
                console.error("Die Antwort ist kein Array:", fetchedProjects);
                alert("Fehler: Die Antwort ist kein Array.");
            }
        } catch (error) {
            console.error("Fehler beim Abrufen der Projekte:", error);
        }
    }

    function displayProjects(projects) {
        const projectList = document.getElementById("project-list");
        projectList.innerHTML = "";

        if (projects.length === 0) {
            projectList.innerHTML = "<p>Keine Projekte gefunden.</p>";
            return;
        }

        projects.forEach(project => {
            const projectItem = document.createElement("div");
            projectItem.classList.add("project-item");
            projectItem.innerHTML = `
                <h3><input type="text" value="${project.title}" id="title-${project.id}"></h3>
                <textarea id="description-${project.id}">${project.description}</textarea>
                <img src="${project.image_url}" alt="${project.title}" style="max-width: 200px; display: block; margin-top: 10px;">
                <input type="text" value="${project.image_url}" id="image-url-${project.id}">
                <p>Technologien: <input type="text" value="${project.tech_used}" id="tech-${project.id}"></p>
                <p>GitHub: <input type="text" value="${project.github_rep_link}" id="github-${project.id}"></p>
                <p>Live Demo: <input type="text" value="${project.live_demo_link}" id="live-${project.id}"></p>
                <button type="button" class="save-button" data-id="${project.id}">Aktualisieren</button>
                <button type="button" class="delete-button" data-id="${project.id}">Löschen</button>
            `;
            projectList.appendChild(projectItem);
        });

        // Event-Listener für die Schaltflächen "Aktualisieren" und "Löschen" hinzufügen
        addProjectEventListeners();
    }

    function addProjectEventListeners() {
        document.querySelectorAll('.save-button').forEach(button => {
            button.addEventListener('click', async (event) => {
                const projectId = event.target.getAttribute('data-id');
                await updateProject(projectId);
            });
        });

        document.querySelectorAll('.delete-button').forEach(button => {
            button.addEventListener('click', async (event) => {
                const projectId = event.target.getAttribute('data-id');
                await deleteProject(projectId);
            });
        });
    }

    // Funktionen zum Aktualisieren und Löschen eines Projekts
    async function updateProject(projectId) {
        const title = document.getElementById(`title-${projectId}`).value;
        const description = document.getElementById(`description-${projectId}`).value;
        const imgUrl = document.getElementById(`image-url-${projectId}`).value;
        const techUsed = document.getElementById(`tech-${projectId}`).value;
        const githubUrl = document.getElementById(`github-${projectId}`).value;
        const liveDemoLink = document.getElementById(`live-${projectId}`).value;

        const updatedProject = {
            title,
            description,
            imgUrl,
            techUsed,
            githubUrl,
            liveDemoLink
        };

        try {
            const response = await fetch(`http://localhost:3000/projects/${projectId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatedProject),
            });

            const data = await response.json();
            if (response.ok) {
                alert("✅ Projekt erfolgreich aktualisiert!");
            } else {
                alert("❌ Fehler beim Aktualisieren: " + data.message);
            }
        } catch (error) {
            console.error("Fehler beim Aktualisieren des Projekts:", error);
            alert("❌ Fehler beim Aktualisieren des Projekts.");
        }
    }

    async function deleteProject(projectId) {
        const confirmDelete = confirm("Bist du sicher, dass du dieses Projekt löschen möchtest?");
        if (!confirmDelete) return;

        try {
            const response = await fetch(`http://localhost:3000/projects/${projectId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();
            if (response.ok) {
                alert("✅ Projekt erfolgreich gelöscht!");
                await searchProject(); 
            } else {
                alert("❌ Fehler beim Löschen: " + data.message);
            }
        } catch (error) {
            console.error("Fehler beim Löschen des Projekts:", error);
            alert("❌ Fehler beim Löschen des Projekts.");
        }
    }
});
