// QLD Health Capstone Project - Auditor Search Application
// This script handles data loading, parsing, filtering, and rendering of approved auditors

<<<<<<< HEAD
document.addEventListener("DOMContentLoaded", function () {
    // wait for page to load before initializing all functionality

    // convert excel data to usable format - handles actual Excel files
    function parseAuditorExcel(arrayBuffer) {
        // parse the excel file using xlsx library
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        
        // get the first worksheet
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        
        // convert worksheet to json array
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        // skip first 2 rows (empty row and description row), get headers from row 2 (index 2)
        const [headerLine, ...dataLines] = jsonData.slice(2);
        
        // handle merged cells - track current organization name
        let currentOrganization = "";
        
        // convert rows into objects by column name
        return dataLines.map(line => {
            const obj = {};
            headerLine.forEach((header, i) => {
                obj[header] = line[i] || "";
            });
            
            // handle merged organization cells - if organization is empty, use the last one
            if (obj["Organisation"] && obj["Organisation"].trim() !== "") {
                currentOrganization = obj["Organisation"];
            } else if (currentOrganization) {
                obj["Organisation"] = currentOrganization;
            }
            
            return obj;
        });
    }

    // convert csv data to usable format - handles Excel-like CSV with merged cells
=======
    // convert csv data to usable format /// NO LONGER NEEDED ///////////
>>>>>>> 45ad4682cbcc6e3f82ca45636624f0e73447657d
    function parseAuditorCSV(data) {
        const rows = [];
        let currentRow = '';
        let insideQuotes = false;

        // merge if row is multiple lines long (handles CSV with line breaks in quoted fields)
        data.split(/\r?\n/).forEach(line => {
            const quoteCount = (line.match(/"/g) || []).length;
            // add line to current row
            currentRow += (currentRow ? "\n" : "") + line;
            
            // push complete row if number of quotes is even and we arent inside a quote
            if (quoteCount % 2 === 0 && !insideQuotes) {
                rows.push(currentRow);
                currentRow = '';
            } else {
                // continue collecting lines for multi-line quoted fields
                insideQuotes = !insideQuotes;
            }
        });

        // get headers and remaining rows (skip first 2 rows for Excel format)
        const [headerLine, ...dataLines] = rows.slice(2);
        const headers = splitCSVLine(headerLine);

        // convert rows into objects by column name
        let currentOrganization = ""; // track current org for merged cells
        return dataLines.map(line => {
            const values = splitCSVLine(line); // split row fields
            const obj = {};
            headers.forEach((header, i) => {
                obj[header.trim()] = values[i] || ""; // assign empty string if no value
            });
            
            // handle merged organization cells - if organization is empty, use the last one
            if (obj["Organisation"] && obj["Organisation"].trim() !== "") {
                currentOrganization = obj["Organisation"];
            } else if (currentOrganization) {
                obj["Organisation"] = currentOrganization;
            }
            
            return obj;
        });
    }

<<<<<<< HEAD
    // function to split a line in csv into array of values - handles quoted fields properly
=======
    // convert date in excel to js date
    function excelDateToJSDate(serial) {
        const utc_days = Math.floor(serial - 25569); // days since 1970-01-01
        const utc_value = utc_days * 86400; // seconds in a day
        const date = new Date(utc_value * 1000); // convert to milliseconds
        const options = { year: 'numeric', month: 'short', day: 'numeric' }; // format date
        return date.toLocaleDateString('en-AU', options);
}

    // function to split a line in csv into array of values
>>>>>>> 45ad4682cbcc6e3f82ca45636624f0e73447657d
    function splitCSVLine(line) {
        const values = [];
        let current = '';
        let insideQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            const nextChar = line[i + 1];

            if (char === '"' && insideQuotes && nextChar === '"') {
                current += '"'; // handle escaped quotes (double quotes)
                i++;
            } else if (char === '"') {
                // toggle quote state when encountering quotes
                insideQuotes = !insideQuotes;
            } else if (char === ',' && !insideQuotes) {
                // end of field if outside quotes and comma is found
                values.push(current.trim());
                current = '';
            } else {
                // add char to current field
                current += char;
            }
        }
        // push final field (last field in the line)
        values.push(current.trim());

        return values;
    }


    // store all auditors in global variable
    let allAuditors = [];
    
    // get list of unique regions from all auditors for dropdown filter
    function getUniqueRegions(auditors) {
        const allRegions = new Set();
        auditors.forEach(auditor => {
            // check if regions exist for this auditor
            if (auditor.regions) {
                const regions = auditor.regions.split(",").map(r => r.trim().replace(/['"]+/g, ''));
                regions.forEach(region => {
                    // skip empty regions
                    if (region) allRegions.add(region);
                });
            }
        });
        // sort regions alphabetically a-z
        return Array.from(allRegions).sort();
    }

    // add regions to dropdown filter menu
    function populateRegionDropdown(regions) {
        const dropdown = document.getElementById("region-select");
        // add default placeholder option
        dropdown.innerHTML = '<option value="" disabled selected>Choose</option>';
        // add "any" option to show all regions
        const anyOption = document.createElement("option");
        anyOption.value = "any";
        anyOption.textContent = "Any";
        dropdown.appendChild(anyOption);
        
        // add each unique region as an option
        regions.forEach(region => {
            const option = document.createElement("option");
            option.value = region;
            option.textContent = region;
            dropdown.appendChild(option);
        });
    }

    // filter auditors based on search term and selected filter options
    function filterAuditors() {
        const searchTerm = document.querySelector(".auditor-search-input").value.toLowerCase();
        const selectedRegion = document.getElementById("region-select").value;
        const standardChecked = document.getElementById("standard").checked;
        const cookChillChecked = document.getElementById("cookChill").checked;
        const heatTreatmentChecked = document.getElementById("heatTreatment").checked;
        const selectedSource = document.getElementById("auditor-source-select").value;


        const filtered = allAuditors.filter(auditor => {
            // check if auditor matches search term (name or registration number)
            const matchesSearch = !searchTerm || 
                (auditor.name && auditor.name.toLowerCase().includes(searchTerm)) ||
                (auditor.registrationNumber && auditor.registrationNumber.toLowerCase().includes(searchTerm));

            // check if auditor matches selected region (skip if "any" is selected)
            const matchesRegion = selectedRegion === "any" || !selectedRegion || 
                (auditor.regions && auditor.regions.toLowerCase().includes(selectedRegion.toLowerCase()));

            // check if auditor matches selected scopes (using boolean values from CSV)
            const matchesScopes = (
                (!standardChecked || (auditor.scopes && auditor.scopes.standard === true)) &&
                (!cookChillChecked || (auditor.scopes && auditor.scopes.cookChill === true)) &&
                (!heatTreatmentChecked || (auditor.scopes && auditor.scopes.heatTreatment === true))
            );

<<<<<<< HEAD
            // return true if auditor matches all criteria
            return matchesSearch && matchesRegion && matchesScopes;
=======
            //source filter 
            const matchesSource = selectedSource === "any" || auditor.source === selectedSource;

            // return true if all match
            return matchesSearch && matchesRegion && matchesScopes && matchesSource;;
>>>>>>> 45ad4682cbcc6e3f82ca45636624f0e73447657d
        });

        // render the filtered results
        renderAuditors(filtered);
    }

    // function to shuffle the order of the auditor list (randomize display order)
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]]; // swap elements
        }
    }

    // add event listeners for all interactive elements
    document.querySelector(".search-button").addEventListener("click", filterAuditors);
    document.querySelector(".auditor-search-input").addEventListener("keyup", (e) => {
        // trigger search when enter key is pressed
        if (e.key === "Enter") filterAuditors();
    });
    document.getElementById("region-select").addEventListener("change", filterAuditors);
    document.getElementById("standard").addEventListener("change", filterAuditors);
    document.getElementById("cookChill").addEventListener("change", filterAuditors);
    document.getElementById("heatTreatment").addEventListener("change", filterAuditors);
    document.getElementById("auditor-source-select").addEventListener("change", filterAuditors);

    // create cards for each auditor and display them on the page
    function renderAuditors(auditorList) {
        const resultsContainer = document.getElementById("results-container");
        resultsContainer.innerHTML = "";

        // randomize the order of auditor list for fair display
        shuffleArray(auditorList);

        // show no results message if no auditors match criteria
        if (auditorList.length === 0) {
            const noResults = document.createElement("div");
            noResults.className = "no-results";
            noResults.textContent = "No auditors found matching your criteria";
            resultsContainer.appendChild(noResults);
            return;
        }

        auditorList.forEach((auditor) => {
            // create card container for each auditor
            const card = document.createElement("div");
            card.className = "result-card";

            // add header section with name, registration, and expiry
            const header = document.createElement("div");
            header.className = "result-header";

            const name = document.createElement("h3");
            // use n/a if no name available
            name.textContent = auditor.name || "N/A";

            const regNumber = document.createElement("span");
            regNumber.className = "registration-number";
            // use n/a if no registration number
            regNumber.textContent = auditor.registrationNumber || "N/A";

            const expiryDate = document.createElement("span");
            expiryDate.className = "expiry-date";
            // use n/a if no expiry date
            expiryDate.textContent = `Expires: ${auditor.expiryDate || "N/A"}`;

            header.appendChild(name);
            header.appendChild(regNumber);
            header.appendChild(expiryDate);

            // add content section with company and contact details
            const content = document.createElement("div");
            content.className = "result-content";

            const grid = document.createElement("div");
            grid.className = "result-grid";

            // add company information section
            const companyInfo = document.createElement("div");
            companyInfo.className = "company-info";

            const companyName = document.createElement("p");
            companyName.className = "info-label";
            // use n/a if no company name
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
                // handle multiple phone numbers
                phone.innerHTML = "Phone:<br>" + auditor.phone.map(p => `<div>${p}</div>`).join("");
            } else {
                // use n/a if no phone number
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

            // add scope information section (audit capabilities)
            const scopeInfo = document.createElement("div");
            scopeInfo.className = "scope-info";

            const scopeTitle = document.createElement("p");
            scopeTitle.className = "info-label";
            scopeTitle.textContent = "Scopes";

            const scopeDetails = document.createElement("div");
            scopeDetails.className = "info-value";

            const standard = document.createElement("p");
            // convert boolean to yes/no display for high risk standard
            standard.textContent = `High Risk: ${auditor.scopes?.standard === true ? "Yes" : "No"}`;

            const cookChill = document.createElement("p");
            // convert boolean to yes/no display for cook chill scope
            cookChill.textContent = `Cook Chill: ${auditor.scopes?.cookChill === true ? "Yes" : "No"}`;

            const heatTreatment = document.createElement("p");
            // convert boolean to yes/no display for heat treatment scope
            heatTreatment.textContent = `Heat Treatment: ${auditor.scopes?.heatTreatment === true ? "Yes" : "No"}`;

            scopeDetails.appendChild(standard);
            scopeDetails.appendChild(cookChill);
            scopeDetails.appendChild(heatTreatment);

            scopeInfo.appendChild(scopeTitle);
            scopeInfo.appendChild(scopeDetails);

            // add region information section (service areas)
            const regionInfo = document.createElement("div");
            regionInfo.className = "region-info";

            const regionTitle = document.createElement("p");
            regionTitle.className = "info-label";
            regionTitle.textContent = "Regions";

            const regionDetails = document.createElement("div");
            regionDetails.className = "info-value";
            // use n/a if no regions available
            const fullText = auditor.regions || "N/A";
            // check if text is over 210 chars long (truncate if too long)
            const isLong = fullText.length > 210; 
            // span element for truncated region text
            const preview = document.createElement("span");
            preview.textContent = isLong ? fullText.slice(0, 200) + "..." : fullText; 
            // extended span element to show full text when expanded
            const full = document.createElement("span");
            full.textContent = fullText;
            full.style.display = "none";

            // clickable element to toggle between preview and full text
            const toggle = document.createElement("a");
            toggle.href = "#";
            toggle.textContent = "Show more";
            toggle.className = "toggle-link";
            toggle.style.display = isLong ? "inline" : "none";
            toggle.style.marginLeft = "8px";

            // handle click to expand/collapse region text
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

            // add all sections to the grid layout
            grid.appendChild(companyInfo);
            grid.appendChild(scopeInfo);
            grid.appendChild(regionInfo);

            // add grid to content section
            content.appendChild(grid);

            // add header and content to the card
            card.appendChild(header);
            card.appendChild(content);

            // add completed card to the results container
            resultsContainer.appendChild(card);
        });
    }

<<<<<<< HEAD
    // load and show data from hosted Excel file
    console.log("Starting to fetch Excel file from hosted URL...");
    // Excel file hosted on your personal website (andersonbee.com)
    // Using CORS proxy temporarily for testing
    const excelUrl = "https://api.allorigins.win/raw?url=" + encodeURIComponent("https://andersonbee.com/approved-auditor%20(4).xlsx");
    
    // simple direct fetch - no CORS issues since it's a hosted file
    function loadExcelData() {
        console.log("Fetching Excel file from:", excelUrl);
        
        fetch(excelUrl)
            .then(res => {
                console.log("Response received:", res.status, res.statusText);
                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }
                return res.arrayBuffer();
            })
            .then(arrayBuffer => {
                console.log("Excel data loaded successfully, size:", arrayBuffer.byteLength, "bytes");
                processExcelData(arrayBuffer);
            })
            .catch(err => {
                console.error("Error loading Excel file:", err);
                alert(`Unable to load auditor data from Excel file. Error: ${err.message}\n\nPlease check that the Excel file URL is correct and accessible.`);
            });
    }
    
    // convert excel serial date to readable format
    function convertExcelDate(excelSerial) {
        if (!excelSerial || isNaN(excelSerial)) return "N/A";
        
        // excel serial date starts from jan 1, 1900 (but excel has a bug where it thinks 1900 is a leap year)
        // so we need to adjust by subtracting 2 days
        const excelEpoch = new Date(1900, 0, 1);
        const date = new Date(excelEpoch.getTime() + (excelSerial - 2) * 24 * 60 * 60 * 1000);
        
        // format as dd-mmm-yy (e.g., "26-Jun-26")
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const day = date.getDate().toString().padStart(2, '0');
        const month = months[date.getMonth()];
        const year = date.getFullYear().toString().slice(-2);
        
        return `${day}-${month}-${year}`;
    }

    function processExcelData(arrayBuffer) {
        try {
            const parsed = parseAuditorExcel(arrayBuffer);
            console.log("Parsed data:", parsed.length, "rows");

            // format the excel data into auditor objects with proper field mapping
            allAuditors = parsed
                .filter(row => row["Auditor Name"] && row["Auditor Name"].trim() !== "") // filter by auditor name instead of organisation
                .map((row, index) => ({
                    id: index + 1,
                    name: row["Auditor Name"] || "N/A",
                    registrationNumber: row["Approval No."] || "N/A",
                    company: row["Organisation"] || "N/A",
                    phone: (row["Phone No."] || "").replace(/\n/g, " ").trim() || "N/A", // clean up phone numbers with line breaks
                    email: row["Email"] || "N/A",
                    scopes: {
                        // normalize scope values to handle case inconsistencies (yes/no to boolean)
                        standard: (row["Standard (high risk)"] || "").toLowerCase() === "yes",
                        cookChill: (row["Cook Chill"] || "").toLowerCase() === "yes",
                        heatTreatment: (row["Heat Treatment"] || "").toLowerCase() === "yes"
                    },
                    // convert excel serial date to readable format
                    expiryDate: convertExcelDate(row["Approval Expiry "] || row["Approval Expiry"]),
                    regions: row["Local government areas of service"] || "N/A"
                }));
=======

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
>>>>>>> 45ad4682cbcc6e3f82ca45636624f0e73447657d

            // setup region dropdown and display initial data
            const uniqueRegions = getUniqueRegions(allAuditors);
            populateRegionDropdown(uniqueRegions);

<<<<<<< HEAD
            // render all auditors initially
            renderAuditors(allAuditors);
        } catch (parseErr) {
            console.error("Error parsing Excel data:", parseErr);
            alert("Error parsing the Excel file. The file format may have changed. Please contact support.");
        }
    }
    
    // start loading data
    loadExcelData();
=======
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
    

>>>>>>> 45ad4682cbcc6e3f82ca45636624f0e73447657d

});