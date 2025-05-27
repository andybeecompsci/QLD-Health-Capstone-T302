document.addEventListener("DOMContentLoaded", function () {
    // wait for page to load

    // convert csv data to usable format
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

        const filtered = allAuditors.filter(auditor => {
            // check name and registration matches
            const matchesSearch = !searchTerm || 
                (auditor.name && auditor.name.toLowerCase().includes(searchTerm)) ||
                (auditor.registrationNumber && auditor.registrationNumber.toLowerCase().includes(searchTerm));

            // check region matches (skip if "any" is selected)
            const matchesRegion = selectedRegion === "any" || !selectedRegion || 
                (auditor.regions && auditor.regions.toLowerCase().includes(selectedRegion.toLowerCase()));

            // check certifications match
            const matchesCertifications = (
                (!standardChecked || (auditor.certifications && auditor.certifications.standard === "Yes")) &&
                (!cookChillChecked || (auditor.certifications && auditor.certifications.cookChill === "Yes")) &&
                (!heatTreatmentChecked || (auditor.certifications && auditor.certifications.heatTreatment === "Yes"))
            );

            // return true if all match
            return matchesSearch && matchesRegion && matchesCertifications;
        });

        renderAuditors(filtered);
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

    // create cards for each auditor
    function renderAuditors(auditorList) {
        const resultsContainer = document.getElementById("results-container");
        resultsContainer.innerHTML = "";

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

            header.appendChild(name);
            header.appendChild(regNumber);

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

            const contactInfo = document.createElement("div");
            contactInfo.className = "info-value";

            const phone = document.createElement("div");
            if (Array.isArray(auditor.phone)) {
                phone.innerHTML = "Phone:<br>" + auditor.phone.map(p => `<div>${p}</div>`).join("");
            } else {
                // use n/a if no phone
                phone.innerHTML = `Phone:<br><div>${auditor.phone || "N/A"}</div>`;
            }

            const email = document.createElement("p");
            // use n/a if no email
            email.textContent = `Email: ${auditor.email || "N/A"}`;

            contactInfo.appendChild(phone);
            contactInfo.appendChild(email);

            companyInfo.appendChild(companyName);
            companyInfo.appendChild(contactInfo);

            // add certification info
            const certInfo = document.createElement("div");
            certInfo.className = "certification-info";

            const certTitle = document.createElement("p");
            certTitle.className = "info-label";
            certTitle.textContent = "Certifications";

            const certDetails = document.createElement("div");
            certDetails.className = "info-value";

            const standard = document.createElement("p");
            // use n/a if no standard cert
            standard.textContent = `Standard: ${auditor.certifications?.standard || "N/A"}`;

            const cookChill = document.createElement("p");
            cookChill.textContent = `Cook Chill: ${auditor.certifications?.cookChill || "N/A"}`;

            const heatTreatment = document.createElement("p");
            heatTreatment.textContent = `Heat Treatment: ${auditor.certifications?.heatTreatment || "N/A"}`;

            certDetails.appendChild(standard);
            certDetails.appendChild(cookChill);
            certDetails.appendChild(heatTreatment);

            certInfo.appendChild(certTitle);
            certInfo.appendChild(certDetails);

            // add region info
            const regionInfo = document.createElement("div");
            regionInfo.className = "region-info";

            const regionTitle = document.createElement("p");
            regionTitle.className = "info-label";
            regionTitle.textContent = "Regions";

            const regionDetails = document.createElement("p");
            regionDetails.className = "info-value";
            // use n/a if no regions
            regionDetails.textContent = auditor.regions || "N/A";

            regionInfo.appendChild(regionTitle);
            regionInfo.appendChild(regionDetails);

            // add sections to grid
            grid.appendChild(companyInfo);
            grid.appendChild(certInfo);
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

    // load and show data
    fetch("Approved_Auditors.csv")
        .then(res => res.text())
        .then(data => {
            const parsed = parseAuditorCSV(data);

            // format the data
            allAuditors = parsed
                .filter(row => row["Organisation"])
                .map((row, index) => ({
                    id: index + 1,
                    name: row["Auditor Name"],
                    registrationNumber: row["Approval No."],
                    company: row["Organisation"],
                    phone: row["Phone No."]
                            .match(/\d{2,4}(?: \d{3,4}){2}/g), // phone numbers regex
                    email: row["Email"],
                    certifications: {
                        standard: row["Standard (high risk)"],
                        cookChill: row["Cook Chill"],
                        heatTreatment: row["Heat Treatment"]
                    },
                    regions: row["Local government areas of service"]
                }));

            // setup and show initial data
            const uniqueRegions = getUniqueRegions(allAuditors);
            populateRegionDropdown(uniqueRegions);
            renderAuditors(allAuditors);
        })
        .catch(err => {
            // log errors
            console.error("Error loading CSV:", err);
        });

    // todo: add these features later
    // 1. search functionality - filter cards by name or registration number
    // 2. region filter - dropdown to filter by region
    // 3. certification filters - checkboxes to filter by certification types
});