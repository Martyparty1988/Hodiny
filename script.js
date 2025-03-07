(function () {
    let period = localStorage.getItem('period') || '';
    let entries = JSON.parse(localStorage.getItem('entries') || '[]');

    const periodInput = document.getElementById('period');
    const saveSettingsBtn = document.getElementById('saveSettingsBtn');
    const settingsStatus = document.getElementById('settingsStatus');

    const employeeSelect = document.getElementById('employeeSelect');
    const entryDateInput = document.getElementById('entryDate');
    const arrivalTimeInput = document.getElementById('arrivalTime');
    const departureTimeInput = document.getElementById('departureTime');
    const breakMinInput = document.getElementById('breakMin');
    const wellnessMinInput = document.getElementById('wellnessMin');
    const overtimeMinInput = document.getElementById('overtimeMin');
    const originInput = document.getElementById('origin');
    const receivedCZKInput = document.getElementById('receivedCZK');
    const receivedEURInput = document.getElementById('receivedEUR');
    const purposeInput = document.getElementById('purpose');
    const paymentsCZKInput = document.getElementById('paymentsCZK');
    const payoutCZKInput = document.getElementById('payoutCZK');
    const addEntryBtn = document.getElementById('addEntryBtn');
    const entryStatus = document.getElementById('entryStatus');

    const filterFromInput = document.getElementById('filterFrom');
    const filterToInput = document.getElementById('filterTo');
    const filterBtn = document.getElementById('filterBtn');
    const entriesTable = document.getElementById('entriesTable').querySelector('tbody');

    const calculateSummaryBtn = document.getElementById('calculateSummaryBtn');
    const summaryTable = document.getElementById('summaryTable').querySelector('tbody');

    periodInput.value = period;
    renderEntries();

    saveSettingsBtn.addEventListener('click', () => {
        period = periodInput.value.trim();
        localStorage.setItem('period', period);
        settingsStatus.textContent = 'Období uloženo.';
        setTimeout(() => settingsStatus.textContent = '', 2000);
    });

    addEntryBtn.addEventListener('click', () => {
        const employee = employeeSelect.value;
        const dateStr = entryDateInput.value.trim();
        if (!dateStr) {
            entryStatus.textContent = 'Zadejte datum.';
            return;
        }
        const arrival = arrivalTimeInput.value.trim();
        const departure = departureTimeInput.value.trim();
        const breakMin = parseInt(breakMinInput.value) || 0;
        const wellnessMin = parseInt(wellnessMinInput.value) || 0;
        const overtimeMin = parseInt(overtimeMinInput.value) || 0;
        const origin = originInput.value.trim();
        const receivedCZK = parseFloat(receivedCZKInput.value) || 0;
        const receivedEUR = parseFloat(receivedEURInput.value) || 0;
        const purpose = purposeInput.value.trim();
        const paymentsCZK = parseFloat(paymentsCZKInput.value) || 0;
        const payoutCZK = parseFloat(payoutCZKInput.value) || 0;

        const id = generateId();
        const entry = { id, employee, dateStr, arrival, departure, breakMin, wellnessMin, overtimeMin, origin, receivedCZK, receivedEUR, purpose, paymentsCZK, payoutCZK };
        entries.push(entry);
        saveData();

        entryDateInput.value = '';
        arrivalTimeInput.value = '';
        departureTimeInput.value = '';
        breakMinInput.value = '0';
        wellnessMinInput.value = '0';
        overtimeMinInput.value = '0';
        originInput.value = '';
        receivedCZKInput.value = '0';
        receivedEURInput.value = '0';
        purposeInput.value = '';
        paymentsCZKInput.value = '0';
        payoutCZKInput.value = '0';

        renderEntries(filterFromInput.value, filterToInput.value);
        entryStatus.textContent = 'Záznam přidán.';
        setTimeout(() => entryStatus.textContent = '', 2000);
    });

    filterBtn.addEventListener('click', () => {
        renderEntries(filterFromInput.value, filterToInput.value);
    });

    calculateSummaryBtn.addEventListener('click', () => {
        calculateSummary(filterFromInput.value, filterToInput.value);
    });

    entriesTable.addEventListener('click', (e) => {
        if (e.target.classList.contains('removeEntryBtn')) {
            const id = e.target.dataset.id;
            if (confirm('Opravdu smazat tento záznam?')) {
                entries = entries.filter(en => en.id !== id);
                saveData();
                renderEntries(filterFromInput.value, filterToInput.value);
            }
        }
    });

    function saveData() {
        localStorage.setItem('entries', JSON.stringify(entries));
    }

    function generateId() {
        return Math.random().toString(36).substr(2, 9);
    }

    function parseTime(tstr) {
        if (!tstr) return null;
        const parts = tstr.split(':');
        if (parts.length !== 2) return null;
        const h = parseInt(parts[0]);
        const m = parseInt(parts[1]);
        if (isNaN(h) || isNaN(m)) return null;
        return h * 60 + m;
    }

    function parseDate(dstr) {
        if (!dstr) return null;
        const parts = dstr.split('.');
        if (parts.length !== 3) return null;
        const day = parseInt(parts[0]);
        const month = parseInt(parts[1]);
        const year = parseInt(parts[2]);
        if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
        return new Date(year, month - 1, day);
    }

    function dateInRange(dateStr, fromStr, toStr) {
        const d = parseDate(dateStr);
        if (!d) return false;
        let fromD = parseDate(fromStr);
        let toD = parseDate(toStr);
        if (!fromD) fromD = new Date(-8640000000000000);
        if (!toD) toD = new Date(8640000000000000);
        return d >= fromD && d <= toD;
    }

    function getEmployeeRate(employee) {
        return employee === 'Marty' ? 400 : employee === 'Maru' ? 275 : 0;
    }

    function getBossShare(employee, dailyEarnings) {
        return employee === 'Marty' ? dailyEarnings * 0.5 : employee === 'Maru' ? dailyEarnings * (1 / 3) : 0;
    }

    function renderEntries(fromStr, toStr) {
        let filtered = entries.filter(e => dateInRange(e.dateStr, fromStr, toStr));
        if (filtered.length === 0) {
            entriesTable.innerHTML = `<tr><td colspan="16" class="no-data">Žádné záznamy</td></tr>`;
            return;
        }
        filtered.sort((a, b) => parseDate(a.dateStr) - parseDate(b.dateStr));
        entriesTable.innerHTML = filtered.map(e => {
            const arrMin = parseTime(e.arrival);
            const depMin = parseTime(e.departure);
            let workMin = 0;
            if (arrMin !== null && depMin !== null && depMin > arrMin) {
                workMin = (depMin - arrMin - e.breakMin) + e.wellnessMin + e.overtimeMin;
                if (workMin < 0) workMin = 0;
            }
            const workHours = workMin / 60;
            const rate = getEmployeeRate(e.employee);
            const dailyEarnings = Math.round(workHours * rate * 100) / 100;

            return `<tr>
                <td data-label="Zaměstnanec">${e.employee}</td>
                <td data-label="Datum">${e.dateStr}</td>
                <td data-label="Příchod">${e.arrival || ''}</td>
                <td data-label="Odchod">${e.departure || ''}</td>
                <td data-label="Pauza">${e.breakMin} min</td>
                <td data-label="Wellness">${e.wellnessMin} min</td>
                <td data-label="Více-práce">${e.overtimeMin} min</td>
                <td data-label="Prac. doba">${workHours > 0 ? (Math.floor(workHours) + 'h ' + Math.round((workHours % 1) * 60) + 'm') : '0h'}</td>
                <td data-label="Den. výdělek">${dailyEarnings > 0 ? dailyEarnings + ' Kč' : '0 Kč'}</td>
                <td data-label="Původ">${e.origin || ''}</td>
                <td data-label="Přijato Kč">${e.receivedCZK > 0 ? e.receivedCZK + ' Kč' : '0 Kč'}</td>
                <td data-label="Přijato €">${e.receivedEUR > 0 ? e.receivedEUR + ' €' : '0 €'}</td>
                <td data-label="Účel">${e.purpose || ''}</td>
                <td data-label="Platby (Kč)">${e.paymentsCZK > 0 ? e.paymentsCZK + ' Kč' : '0 Kč'}</td>
                <td data-label="Výplata (Kč)">${e.payoutCZK > 0 ? e.payoutCZK + ' Kč' : '0 Kč'}</td>
                <td data-label="Akce"><button class="removeEntryBtn" data-id="${e.id}">Smazat</button></td>
            </tr>`;
        }).join('');
    }

    function calculateSummary(fromStr, toStr) {
        let filtered = entries.filter(e => dateInRange(e.dateStr, fromStr, toStr));
        if (filtered.length === 0) {
            summaryTable.innerHTML = `<tr><td colspan="9" class="no-data">Zatím žádný souhrn</td></tr>`;
            return;
        }

        let totalMinutes = 0, totalCZK = 0, totalReceivedCZK = 0, totalReceivedEUR = 0, totalPaymentsCZK = 0, totalPayoutCZK = 0, totalBoss = 0;
        for (let e of filtered) {
            const arrMin = parseTime(e.arrival);
            const depMin = parseTime(e.departure);
            let workMin = 0;
            if (arrMin !== null && depMin !== null && depMin > arrMin) {
                workMin = (depMin - arrMin - e.breakMin) + e.wellnessMin + e.overtimeMin;
                if (workMin < 0) workMin = 0;
            }
            totalMinutes += workMin;

            const rate = getEmployeeRate(e.employee);
            const dailyEarnings = (workMin / 60) * rate;
            totalCZK += dailyEarnings;
            totalBoss += getBossShare(e.employee, dailyEarnings);

            totalReceivedCZK += e.receivedCZK;
            totalReceivedEUR += e.receivedEUR;
            totalPaymentsCZK += e.paymentsCZK;
            totalPayoutCZK += e.payoutCZK;
        }

        const totalHours = totalMinutes / 60;
        const netEarnings = totalCZK - totalBoss;
        const finalBalance = totalReceivedCZK - totalPaymentsCZK - totalPayoutCZK - netEarnings;

        summaryTable.innerHTML = `<tr class="totals">
            <td>${Math.round(totalHours * 100) / 100} h</td>
            <td>${Math.round(totalCZK)} Kč</td>
            <td>${Math.round(totalReceivedCZK)} Kč</td>
            <td>${Math.round(totalReceivedEUR)} €</td>
            <td>${Math.round(totalPaymentsCZK)} Kč</td>
            <td>${Math.round(totalPayoutCZK)} Kč</td>
            <td>${Math.round(totalBoss)} Kč</td>
            <td>${Math.round(netEarnings)} Kč</td>
            <td>${Math.round(finalBalance)} Kč</td>
        </tr>`;
    }

    function adjustForViewport() {
        const width = window.innerWidth;
        if (width < 480) {
            document.body.style.fontSize = '14px';
        } else {
            document.body.style.fontSize = '16px';
        }
    }

    window.addEventListener('resize', adjustForViewport);
    adjustForViewport();
})();
