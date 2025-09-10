document.addEventListener("DOMContentLoaded", function () {
    // wait for page to load

    // convert csv data to usable format /// NO LONGER NEEDED ///////////
    function parseAuditorCSV(data) {
        const rows = [];
        let currentRow = '';
        let insideQuotes = false;

        // merge if row is multiple lines long
        data.split(/\r?\n/).forEach(line => {
            const quoteCount = (line.match(/"/g) || []).length;
            // add line to current row
            currentRow += (currentRow ? "\n" : "") + line;
            
            // push complete row if number of quotes is even and we arent inside a quote
            if (quoteCount % 2 === 0 && !insideQuotes) {
                rows.push(currentRow);
                currentRow = '';
            } else {
                // continue collecting lines
                insideQuotes = !insideQuotes;
            }
        });

        //get headers and remaining rows
        const [headerLine, ...dataLines] = rows;
        const headers = splitCSVLine(headerLine);

        //convert rows into objects by column name
        return dataLines.map(line => {
            const values = splitCSVLine(line); // split row fields
            const obj = {};
            headers.forEach((header, i) => {
                obj[header.trim()] = values[i] || ""; //assign empty string if no value
            });
            return obj;
        });
    }

    // convert date in excel to js date
    function excelDateToJSDate(serial) {
        const utc_days = Math.floor(serial - 25569); // days since 1970-01-01
        const utc_value = utc_days * 86400; // seconds in a day
        const date = new Date(utc_value * 1000); // convert to milliseconds
        const options = { year: 'numeric', month: 'short', day: 'numeric' }; // format date
        return date.toLocaleDateString('en-AU', options);
}

    // function to split a line in csv into array of values
    function splitCSVLine(line) {
        const values = [];
        let current = '';
        let insideQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            const nextChar = line[i + 1];

            if (char === '"' && insideQuotes && nextChar === '"') {
                current += '"'; // escaped quote
                i++;
            } else if (char === '"') {
                // flag when encountering quotes inside
                insideQuotes = !insideQuotes;
            } else if (char === ',' && !insideQuotes) {
                // end of field if outside quotes and comma is found
                values.push(current.trim());
                current = '';
            } else {
                // add char to field
                current += char;
            }
        }
        //push final field
        values.push(current.trim());

        return values;
    }

    // store all auditors
    let allAuditors = [];
    
    // get list of unique regions
    function getUniqueRegions(auditors) {
        const allRegions = new Set();
        auditors.forEach(auditor => {
            // check if regions exist
            if (auditor.regions) {
                const regions = auditor.regions.split(",").map(r => r.trim().replace(/['"]+/g, ''));
                regions.forEach(region => {
                    // skip empty regions
                    if (region) allRegions.add(region);
                });
            }
        });
        // sort regions a-z
        return Array.from(allRegions).sort();
    }

    // add regions to dropdown
    function populateRegionDropdown(regions) {
        const dropdown = document.getElementById("region-select");
        // add default option
        dropdown.innerHTML = '<option value="" disabled selected>Choose</option>';
        // add any option
        const anyOption = document.createElement("option");
        anyOption.value = "any";
        anyOption.textContent = "Any";
        dropdown.appendChild(anyOption);
        
        regions.forEach(region => {
            const option = document.createElement("option");
            option.value = region;
            option.textContent = region;
            dropdown.appendChild(option);
        });
    }

    // filter auditors based on search and filters
    function filterAuditors() {
        const searchTerm = document.querySelector(".auditor-search-input").value.toLowerCase();
        const selectedRegion = document.getElementById("region-select").value;
        const standardChecked = document.getElementById("standard").checked;
        const cookChillChecked = document.getElementById("cookChill").checked;
        const heatTreatmentChecked = document.getElementById("heatTreatment").checked;
        const selectedSource = document.getElementById("auditor-source-select").value;


        const filtered = allAuditors.filter(auditor => {
            // check name and registration matches
            const matchesSearch = !searchTerm || 
                (auditor.name && auditor.name.toLowerCase().includes(searchTerm)) ||
                (auditor.registrationNumber && auditor.registrationNumber.toLowerCase().includes(searchTerm));

            // check region matches (skip if "any" is selected)
            const matchesRegion = selectedRegion === "any" || !selectedRegion || 
                (auditor.regions && auditor.regions.toLowerCase().includes(selectedRegion.toLowerCase()));

            // check scopes match
            const matchesScopes = (
                (!standardChecked || (auditor.scopes && auditor.scopes.standard === "Yes")) &&
                (!cookChillChecked || (auditor.scopes && auditor.scopes.cookChill === "Yes")) &&
                (!heatTreatmentChecked || (auditor.scopes && auditor.scopes.heatTreatment === "Yes"))
            );

            //source filter 
            const matchesSource = selectedSource === "any" || auditor.source === selectedSource;

            // return true if all match
            return matchesSearch && matchesRegion && matchesScopes && matchesSource;;
        });

        renderAuditors(filtered);
    }

    // function to shuffle the order of the list
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    // add event listeners
    document.querySelector(".search-button").addEventListener("click", filterAuditors);
    document.querySelector(".auditor-search-input").addEventListener("keyup", (e) => {
        // search on enter key
        if (e.key === "Enter") filterAuditors();
    });
    document.getElementById("region-select").addEventListener("change", filterAuditors);
    document.getElementById("standard").addEventListener("change", filterAuditors);
    document.getElementById("cookChill").addEventListener("change", filterAuditors);
    document.getElementById("heatTreatment").addEventListener("change", filterAuditors);
    document.getElementById("auditor-source-select").addEventListener("change", filterAuditors);

    // create cards for each auditor
    function renderAuditors(auditorList) {
        const resultsContainer = document.getElementById("results-container");
        resultsContainer.innerHTML = "";

        // randomize the order of auditor list
        shuffleArray(auditorList);

        // show no results message
        if (auditorList.length === 0) {
            const noResults = document.createElement("div");
            noResults.className = "no-results";
            noResults.textContent = "No auditors found matching your criteria";
            resultsContainer.appendChild(noResults);
            return;
        }

        auditorList.forEach((auditor) => {
            // create card
            const card = document.createElement("div");
            card.className = "result-card";

            // add header
            const header = document.createElement("div");
            header.className = "result-header";

            const name = document.createElement("h3");
            // use n/a if no name
            name.textContent = auditor.name || "N/A";

            const regNumber = document.createElement("span");
            regNumber.className = "registration-number";
            // use n/a if no registration
            regNumber.textContent = auditor.registrationNumber || "N/A";

            const expiryDate = document.createElement("span");
            expiryDate.className = "expiry-date";
            // use n/a if no expiry date
            expiryDate.textContent = `Expires: ${auditor.expiryDate || "N/A"}`;

            header.appendChild(name);
            header.appendChild(regNumber);
            header.appendChild(expiryDate);

            // add content section
            const content = document.createElement("div");
            content.className = "result-content";

            const grid = document.createElement("div");
            grid.className = "result-grid";

            // add company info
            const companyInfo = document.createElement("div");
            companyInfo.className = "company-info";

            const companyName = document.createElement("p");
            companyName.className = "info-label";
            // use n/a if no company
            companyName.textContent = auditor.company || "N/A";

            //source MAYBE DELETE LATER
            const sourceTag = document.createElement("p");
            sourceTag.className = "auditor-source";
            sourceTag.textContent = `Source: ${auditor.source}`;
            companyInfo.appendChild(sourceTag);

            const contactInfo = document.createElement("div");
            contactInfo.className = "info-value";

            const phone = document.createElement("div");
            if (Array.isArray(auditor.phone)) {
                phone.innerHTML = "Phone:<br>" + auditor.phone.map(p => `<div>${p}</div>`).join("");
            } else {
                // use n/a if no phone
                phone.innerHTML = `Phone:<br><div>${auditor.phone || "N/A"}</div>`;
            }

            // trim email if it is n/a

            const email = document.createElement("p");
            email.className = "email";
            // create clickable email link if email exists, otherwise show hide email
            if (auditor.email && auditor.email.trim().toLowerCase() !== "n/a") {
                const emailLink = document.createElement("a");
                // simple mailto link that opens email client
                emailLink.href = `mailto:${auditor.email}`;
                emailLink.textContent = auditor.email;
                email.textContent = "Email: ";
                email.appendChild(emailLink);
            } else {
                email.style.display = "none";
            }

            contactInfo.appendChild(phone);
            contactInfo.appendChild(email);

            companyInfo.appendChild(companyName);
            companyInfo.appendChild(contactInfo);

            // add scope info
            const scopeInfo = document.createElement("div");
            scopeInfo.className = "scope-info";

            const scopeTitle = document.createElement("p");
            scopeTitle.className = "info-label";
            scopeTitle.textContent = "Scopes";

            const scopeDetails = document.createElement("div");
            scopeDetails.className = "info-value";

            const standard = document.createElement("p");
            // use n/a if no high risk scope
            standard.textContent = `High Risk: ${auditor.scopes?.standard || "N/A"}`;

            const cookChill = document.createElement("p");
            cookChill.textContent = `Cook Chill: ${auditor.scopes?.cookChill || "N/A"}`;

            const heatTreatment = document.createElement("p");
            heatTreatment.textContent = `Heat Treatment: ${auditor.scopes?.heatTreatment || "N/A"}`;

            scopeDetails.appendChild(standard);
            scopeDetails.appendChild(cookChill);
            scopeDetails.appendChild(heatTreatment);

            scopeInfo.appendChild(scopeTitle);
            scopeInfo.appendChild(scopeDetails);

            // add region info
            const regionInfo = document.createElement("div");
            regionInfo.className = "region-info";

            const regionTitle = document.createElement("p");
            regionTitle.className = "info-label";
            regionTitle.textContent = "Regions";

            const regionDetails = document.createElement("div");
            regionDetails.className = "info-value";
            // use n/a if no regions
            const fullText = auditor.regions || "N/A";
            // checks if text is over 210 chars long
            const isLong = fullText.length > 210; 
            // span element for region text
            const preview = document.createElement("span");
            preview.textContent = isLong ? fullText.slice(0, 200) + "..." : fullText; 
            // extended span element to show full text
            const full = document.createElement("span");
            full.textContent = fullText;
            full.style.display = "none";

            // clickable element for span 
            const toggle = document.createElement("a");
            toggle.href = "#";
            toggle.textContent = "Show more";
            toggle.className = "toggle-link";
            toggle.style.display = isLong ? "inline" : "none";
            toggle.style.marginLeft = "8px";

            toggle.addEventListener("click", function (e) {
                e.preventDefault();
                const expanded = full.style.display === "inline";
                preview.style.display = expanded ? "inline" : "none";
                full.style.display = expanded ? "none" : "inline";
                toggle.textContent = expanded ? "Show more" : "Show less";
            });
            // add toggle elements to region details
            regionDetails.appendChild(preview);
            regionDetails.appendChild(full);
            regionDetails.appendChild(toggle);

            regionInfo.appendChild(regionTitle);
            regionInfo.appendChild(regionDetails);

            // add sections to grid
            grid.appendChild(companyInfo);
            grid.appendChild(scopeInfo);
            grid.appendChild(regionInfo);

            // add grid to content
            content.appendChild(grid);

            // add everything to card
            card.appendChild(header);
            card.appendChild(content);

            // add card to page
            resultsContainer.appendChild(card);
        });
    }


// load and show data from Excel with multiple sheets
    fetch("data/Approved_Auditor_Register.xlsx")
        .then(res => res.arrayBuffer())
        .then(buffer => {
            const workbook = XLSX.read(buffer, { type: "array" });
            const allParsedAuditors = [];

            workbook.SheetNames.forEach(sheetName => {
                const sheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json(sheet);

                // label source by sheet name
                const sourceLabel = (() => {
                    const name = sheetName.toLowerCase();
                    if (name.includes("local")) return "Local Government Auditors";
                    if (name.includes("qld")) return "QLD Health Approved Auditors";
                    return "Approved Auditors";
                })();

                const parsed = json
                    .filter(row => row["Organisation"])
                    .map((row, index) => ({
                        id: allParsedAuditors.length + index + 1,
                        name: row["Auditor Name"],
                        registrationNumber: row["Approval No."],
                        company: row["Organisation"],
                        phone: row["Phone No."]?.match(/\d{2,4}(?: \d{3,4}){2}/g),
                        email: row["Email"],
                        scopes: {
                            standard: row["Standard (high risk)"],
                            cookChill: row["Cook Chill"],
                            heatTreatment: row["Heat Treatment"]
                        },
                        expiryDate: excelDateToJSDate(row["Approval Expiry "] || row["Approval Expiry"]),
                        regions: row["Local government areas of service"],
                        source: sourceLabel // new field for filtering
                    }));

                allParsedAuditors.push(...parsed);
            });

            allAuditors = allParsedAuditors;

            // setup and show initial data
            const uniqueRegions = getUniqueRegions(allAuditors);
            populateRegionDropdown(uniqueRegions);

            // debug checks REMOVE LATER
            console.log("Total auditors parsed:", allAuditors.length);
            console.log("Auditors missing phone:", allAuditors.filter(a => !a.phone).map(a => a.name));
            console.log("Auditor source breakdown:", allAuditors.reduce((acc, a) => {
                acc[a.source] = (acc[a.source] || 0) + 1;
                return acc;
            }, {}));
            console.log("Auditor names:", allAuditors.map(a => a.name));

            renderAuditors(allAuditors);
        })
        .catch(err => {
            console.error("Error loading Excel:", err);
        });
    


});