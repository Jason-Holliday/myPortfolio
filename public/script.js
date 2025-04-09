document.addEventListener("DOMContentLoaded", () => {
    
    // MODAL-FUNKTIONALITÄT
    initializeModal();

    // PROJEKTE LADEN
    loadProjects();

    // FORMULARE INITIALISIEREN
    initializeForm("#contactForm");       // Haupt-Kontaktformular
    initializeForm("#contactFormModal");  // Modal-Kontaktformular
    
    // NAVIGATION LINKS AUF AKTIVE SETZEN
    setLinksActive();

});

function setLinksActive(){
    const links = document.querySelectorAll('.navLinks li a');
    
    // Event Listener für jedes Link hinzufügen
    links.forEach(link => {
        link.addEventListener('click', function() {
            // Entferne die 'active' Klasse von allen Links
            links.forEach(l => l.classList.remove('active'));
            
            // Füge die 'active' Klasse zum geklickten Link hinzu
            this.classList.add('active');
        });
    });
}

function toggleMenuBurger() {
    const navLinks = document.querySelector(".navLinks");
    const menuIcon = document.getElementById("menuIcon");

    if (navLinks.style.display === "flex") {
        navLinks.style.display = "none";
        menuIcon.classList.remove("fa-times");
        menuIcon.classList.add("fa-bars");
    } else {
        navLinks.style.display = "flex";
        menuIcon.classList.remove("fa-bars");
        menuIcon.classList.add("fa-times");
    }
}


// Funktion zur Initialisierung des Modals

function initializeModal() {
    const modal = document.getElementById("contact-modal");
    const openModalBtn = document.getElementById("open-modal");
    const closeModalBtn = document.getElementById("close-modal");

    if (openModalBtn && modal && closeModalBtn) {
        const focusableSelectors = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
        let focusableElements;
        let firstFocusableElement;
        let lastFocusableElement;

        function updateFocusableElements() {
            focusableElements = modal.querySelectorAll(focusableSelectors);
            firstFocusableElement = focusableElements[0];
            lastFocusableElement = focusableElements[focusableElements.length - 1];
        }

        function openModal() {
            modal.setAttribute("aria-hidden", "false");
            modal.style.display = "flex";  // Modal wird mit flex angezeigt
            updateFocusableElements();
            if (firstFocusableElement) {
                firstFocusableElement.focus(); // Fokus auf das erste interaktive Element setzen
            }
        }

        function closeModal() {
            modal.setAttribute("aria-hidden", "true");
            modal.style.display = "none";  // Modal wird ausgeblendet
            openModalBtn.focus(); // Fokus zurück auf den Button setzen
        }

        openModalBtn.addEventListener("click", openModal);
        closeModalBtn.addEventListener("click", closeModal);

        modal.addEventListener("click", (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });

        modal.addEventListener("keydown", (e) => {
            if (e.key === "Escape") {
                closeModal();
            }

            if (e.key === "Tab" && focusableElements.length > 0) {
                if (e.shiftKey && document.activeElement === firstFocusableElement) {
                    e.preventDefault();
                    lastFocusableElement.focus(); // Springe zum letzten Element
                } else if (!e.shiftKey && document.activeElement === lastFocusableElement) {
                    e.preventDefault();
                    firstFocusableElement.focus(); // Springe zum ersten Element
                }
            }
        });
    } else {
        console.error("Modal-Elemente wurden nicht gefunden!");
    }
}


// Funktion zum Laden der Projekte
async function loadProjects() {
    const projectContainer = document.getElementById("project-grid");

    if (!projectContainer) {
        console.error("Fehler: Das Container-Element für die Projekte wurde nicht gefunden!");
        return;
    }

    try {
        const response = await fetch("https://myportfolio-production-f41c.up.railway.app/projects", {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) throw new Error(`Server-Fehler: ${response.status}`);

        const projects = await response.json();
        console.log("Projekte geladen:", projects);

        if (!Array.isArray(projects) || projects.length === 0) {
            projectContainer.innerHTML = "<p>Keine Projekte gefunden.</p>";
            return;
        }

        displayProjects(projects);
    } catch (error) {
        console.error("Fehler beim Laden der Projekte:", error.message);
        projectContainer.innerHTML = "<p>Fehler beim Laden der Projekte. Bitte versuchen Sie es später erneut.</p>";
    }
}

// Funktion zur Anzeige der Projekte
function displayProjects(projects) {
    const projectList = document.getElementById("project-grid");
    projectList.innerHTML = "";

    projects.forEach(project => {
        const projectItem = document.createElement("div");
        projectItem.classList.add("project-card");
        projectItem.innerHTML = `
            <img src="${project.image_url}" alt="${project.title}">
            <h3>${project.title}</h3>
            <p>${project.description}</p>
            <h4>Verwendete Technologien: ${project.tech_used}</h4>
            <a href="${project.github_rep_link}" target="_blank" class="btn">GitHub Repo</a>
            <a href="${project.live_demo_link}" target="_blank" class="btn">Live Demo</a>
        `;
        projectList.appendChild(projectItem);
    });
}

// Funktion zur Initialisierung der Formulare
function initializeForm(formSelector) {
    const form = document.querySelector(formSelector);
    if (!form) return; // Wenn das Formular nicht gefunden wird, beende die Funktion

    form.addEventListener("submit", async function (event) {
        event.preventDefault(); // Verhindert das Standardverhalten des Formulars

        const formData = new FormData(this); // Erfasst die Formulardaten
        const data = Object.fromEntries(formData); // Konvertiert FormData in ein JSON-Objekt

        try {
            const response = await fetch("https://myportfolio-production-f41c.up.railway.app/send-email", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"  // Erzwinge JSON-Format
                },
                body: JSON.stringify(data) // Sendet die Formulardaten als JSON
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Fehler ${response.status}: ${errorData.message}`);
            }

            alert("E-Mail erfolgreich gesendet!");
            this.reset(); // Setzt das Formular zurück

            // Schließe das Modal nach erfolgreichem Senden
            const modal = document.getElementById("contact-modal");
            modal.setAttribute("aria-hidden", "true");  // Modal verbergen
        } catch (error) {
            alert("Fehler beim Senden der E-Mail: " + error.message);
            console.error("Fehler:", error);
        }
    });
}






