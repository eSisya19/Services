document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const loginContainer = document.getElementById('login-container');
    const mainContainer = document.getElementById('main-container');
    const hospitalForm = document.getElementById('hospital-form');
    const hospitalNameInput = document.getElementById('hospital-name');
    const installDateInput = document.getElementById('install-date');
    const hospitalTableBody = document.getElementById('hospital-table').getElementsByTagName('tbody')[0];
    const warningsDiv = document.getElementById('warnings');
    const searchBar = document.getElementById('search-bar');
    const sortSelect = document.getElementById('sort-select');
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const prevPageButton = document.getElementById('prev-page');
    const nextPageButton = document.getElementById('next-page');
    const pageNumberSpan = document.getElementById('page-number');

    let hospitals = JSON.parse(localStorage.getItem('hospitals')) || [];
    let currentPage = 1;
    const rowsPerPage = 5;

    // Authentication
    const validUsername = 'admin'; // Change these as needed
    const validPassword = 'PARAS-service'; // Change these as needed

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        if (username === validUsername && password === validPassword) {
            loginContainer.classList.add('hidden');
            mainContainer.classList.remove('hidden');
            renderTable();
        } else {
            alert('Invalid username or password');
        }
    });

    function saveHospitals() {
        localStorage.setItem('hospitals', JSON.stringify(hospitals));
    }

    function renderTable(filteredHospitals = hospitals) {
        hospitalTableBody.innerHTML = '';
        const start = (currentPage - 1) * rowsPerPage;
        const end = start + rowsPerPage;
        const paginatedHospitals = filteredHospitals.slice(start, end);

        paginatedHospitals.forEach((hospital, index) => {
            const newRow = hospitalTableBody.insertRow();

            const cell1 = newRow.insertCell(0);
            const cell2 = newRow.insertCell(1);
            const cell3 = newRow.insertCell(2);
            const cell4 = newRow.insertCell(3);
            const cell5 = newRow.insertCell(4);
            const cell6 = newRow.insertCell(5);

            cell1.innerHTML = hospital.name;
            cell2.innerHTML = hospital.installDate;
            cell3.innerHTML = hospital.nextMaintenanceDue;
            cell4.innerHTML = `<input type="checkbox" ${hospital.invoiced ? 'checked' : ''} onclick="toggleInvoiced(${index + start})">`;
            cell5.innerHTML = `<input type="checkbox" ${hospital.paid ? 'checked' : ''} onclick="togglePaid(${index + start})">`;
            cell6.innerHTML = `
                <div class="action-buttons">
                    <button class="done-button ${hospital.done ? 'done' : ''}" onclick="markAsDone(${index + start})">Done</button>
                    <button class="edit-button" onclick="editHospital(${index + start})">Edit</button>
                    <button class="delete-button" onclick="deleteHospital(${index + start})">Delete</button>
                </div>
            `;
        });

        checkWarnings();
        updatePagination(filteredHospitals.length);
    }

    function checkWarnings() {
        const today = new Date();
        warningsDiv.innerHTML = '';

        hospitals.forEach(hospital => {
            const maintenanceDate = new Date(hospital.nextMaintenanceDue);
            const timeDifference = maintenanceDate.getTime() - today.getTime();
            const daysDifference = timeDifference / (1000 * 3600 * 24);

            if (daysDifference <= 7 && daysDifference >= 0) {
                const warningMessage = `Warning: Maintenance due soon for ${hospital.name} on ${hospital.nextMaintenanceDue}.`;
                const warningDiv = document.createElement('div');
                warningDiv.textContent = warningMessage;
                warningsDiv.appendChild(warningDiv);
            }
        });
    }

    window.markAsDone = function(index) {
        const hospital = hospitals[index];
        hospital.done = !hospital.done;
        if (hospital.done) {
            hospital.nextMaintenanceDue = calculateNextMaintenanceDue(hospital.nextMaintenanceDue);
        }
        saveHospitals();
        renderTable();
    };

    window.toggleInvoiced = function(index) {
        hospitals[index].invoiced = !hospitals[index].invoiced;
        saveHospitals();
    };

    window.togglePaid = function(index) {
        hospitals[index].paid = !hospitals[index].paid;
        saveHospitals();
    };

    window.editHospital = function(index) {
        const hospital = hospitals[index];
        hospitalNameInput.value = hospital.name;
        installDateInput.value = hospital.installDate;

        hospitalForm.onsubmit = function(e) {
            e.preventDefault();
            hospital.name = hospitalNameInput.value;
            hospital.installDate = installDateInput.value;
            hospital.nextMaintenanceDue = calculateNextMaintenanceDue(installDateInput.value);
            saveHospitals();
            renderTable();
            hospitalForm.reset();
            hospitalForm.onsubmit = addHospital;
        };
    };

    window.deleteHospital = function(index) {
        hospitals.splice(index, 1);
        saveHospitals();
        renderTable();
    };

    function addHospital(e) {
        e.preventDefault();

        const hospitalName = hospitalNameInput.value;
        const installDate = installDateInput.value;
        const nextMaintenanceDue = calculateNextMaintenanceDue(installDate);

        hospitals.push({ 
            name: hospitalName, 
            installDate: installDate, 
            nextMaintenanceDue: nextMaintenanceDue, 
            invoiced: false, 
            paid: false, 
            done: false 
        });
        saveHospitals();
        renderTable();
        hospitalForm.reset();
    }

    function calculateNextMaintenanceDue(installDate) {
        const nextMaintenanceDue = new Date(installDate);
        nextMaintenanceDue.setMonth(nextMaintenanceDue.getMonth() + 6);
        return nextMaintenanceDue.toISOString().split('T')[0];
    }

    function sortHospitals(sortBy) {
        hospitals.sort((a, b) => {
            if (a[sortBy] < b[sortBy]) return -1;
            if (a[sortBy] > b[sortBy]) return 1;
            return 0;
        });
        renderTable();
    }

    function toggleDarkMode() {
        document.body.classList.toggle('dark-mode');
    }

    function updatePagination(totalRows) {
        const totalPages = Math.ceil(totalRows / rowsPerPage);
        pageNumberSpan.textContent = `${currentPage} / ${totalPages}`;
        prevPageButton.disabled = currentPage === 1;
        nextPageButton.disabled = currentPage === totalPages;
    }

    prevPageButton.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderTable();
        }
    });

    nextPageButton.addEventListener('click', () => {
        const totalPages = Math.ceil(hospitals.length / rowsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            renderTable();
        }
    });

    hospitalForm.onsubmit = addHospital;

    searchBar.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filteredHospitals = hospitals.filter(hospital => hospital.name.toLowerCase().includes(searchTerm));
        renderTable(filteredHospitals);
    });

    sortSelect.addEventListener('change', (e) => {
        sortHospitals(e.target.value);
    });

    darkModeToggle.addEventListener('change', toggleDarkMode);
});
