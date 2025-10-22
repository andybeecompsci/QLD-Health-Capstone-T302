// QLD Health Capstone Project - Auditor Search Application
// This script handles data loading, parsing, filtering, and rendering of approved auditors

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

    // function to split a line in csv into array of values - handles quoted fields properly
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
        const selectedAuditorType = document.getElementById("auditor-source-select").value;
        const standardChecked = document.getElementById("standard").checked;
        const cookChillChecked = document.getElementById("cookChill").checked;
        const heatTreatmentChecked = document.getElementById("heatTreatment").checked;

        // debug logging
        console.log("Filtering with:", { selectedAuditorType, selectedRegion, searchTerm });
        console.log("Total auditors before filter:", allAuditors.length);

        const filtered = allAuditors.filter(auditor => {
            // check if auditor matches search term (name or registration number)
            const matchesSearch = !searchTerm || 
                (auditor.name && auditor.name.toLowerCase().includes(searchTerm)) ||
                (auditor.registrationNumber && auditor.registrationNumber.toLowerCase().includes(searchTerm));

            // check if auditor matches selected region (skip if "any" is selected)
            const matchesRegion = selectedRegion === "any" || !selectedRegion || 
                (auditor.regions && auditor.regions.toLowerCase().includes(selectedRegion.toLowerCase()));

            // check if auditor matches selected auditor type (skip if "any" is selected)
            const matchesAuditorType = selectedAuditorType === "any" || !selectedAuditorType || 
                (auditor.auditorType && auditor.auditorType === selectedAuditorType);

            // check if auditor matches selected scopes (using boolean values from CSV)
            const matchesScopes = (
                (!standardChecked || (auditor.scopes && auditor.scopes.standard === true)) &&
                (!cookChillChecked || (auditor.scopes && auditor.scopes.cookChill === true)) &&
                (!heatTreatmentChecked || (auditor.scopes && auditor.scopes.heatTreatment === true))
            );

            // debug logging for each auditor
            if (selectedAuditorType !== "any" && selectedAuditorType) {
                console.log(`Auditor: ${auditor.name}, Type: ${auditor.auditorType}, Matches: ${matchesAuditorType}`);
            }

            // return true if auditor matches all criteria
            return matchesSearch && matchesRegion && matchesAuditorType && matchesScopes;
        });

        console.log("Filtered results:", filtered.length);

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
    document.getElementById("auditor-source-select").addEventListener("change", filterAuditors);
    document.getElementById("standard").addEventListener("change", filterAuditors);
    document.getElementById("cookChill").addEventListener("change", filterAuditors);
    document.getElementById("heatTreatment").addEventListener("change", filterAuditors);

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


            const contactInfo = document.createElement("div");
            contactInfo.className = "info-value";

            const phone = document.createElement("div");
            if (Array.isArray(auditor.phone)) {
                // handle multiple phone numbers
                phone.innerHTML = "Phone: " + auditor.phone.join(", ");
            } else {
                // use n/a if no phone number
                phone.innerHTML = `Phone: ${auditor.phone || "N/A"}`;
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
            preview.textContent = isLong ? fullText.slice(0, 60) + "..." : fullText; 
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

    // load and show data from hosted Excel file
    console.log("Starting to fetch Excel file from hosted URL...");
    // Excel file hosted on your personal website (andersonbee.com)
    // Using CORS proxy temporarily for testing
    const excelUrl = "https://api.codetabs.com/v1/proxy?quest=" + encodeURIComponent("https://andersonbee.com/approved-auditor%20(4).xlsx");
    
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

            // determine auditor type based on section headers in the excel data
            let currentAuditorType = "Approved Auditors"; // default for first section
            
            // first pass: identify section headers and determine auditor types
            const processedRows = parsed.map((row, index) => {
                const organisation = row["Organisation"] || "";
                const auditorName = row["Auditor Name"] || "";
                
                // debug logging to see what we're processing
                console.log("Processing row:", { organisation, auditorName, currentAuditorType });
                
                // check if this row is a section header
                if (organisation.toLowerCase().includes("local government approved auditors")) {
                    console.log("Found Local Government header, switching type");
                    currentAuditorType = "Local Government Auditors";
                    return { ...row, isHeader: true, auditorType: currentAuditorType };
                } else if (organisation.toLowerCase().includes("queensland health approved auditors")) {
                    console.log("Found QLD Health header, switching type");
                    currentAuditorType = "QLD Health Approved Auditors";
                    return { ...row, isHeader: true, auditorType: currentAuditorType };
                } else if (organisation.toLowerCase().includes("note:")) {
                    return { ...row, isHeader: true, auditorType: currentAuditorType };
                }
                
                // regular auditor row - assign current type
                return { ...row, isHeader: false, auditorType: currentAuditorType };
            });
            
            // handle merged cells for organization and phone number inheritance
            let currentOrganization = "";
            let lastPhoneForOrganization = {};
            
            // process rows to handle merged cells
            const rowsWithInheritedData = processedRows.map(row => {
                if (row.isHeader) return row;
                
                // handle organization inheritance (existing logic)
                if (row["Organisation"] && row["Organisation"].trim() !== "") {
                    currentOrganization = row["Organisation"];
                } else if (currentOrganization) {
                    row["Organisation"] = currentOrganization;
                }
                
                // handle phone number inheritance (new logic)
                const phoneNumber = (row["Phone No."] || "").replace(/\n/g, " ").trim();
                if (phoneNumber && phoneNumber !== "") {
                    // store phone number for this organization
                    lastPhoneForOrganization[currentOrganization] = phoneNumber;
                } else if (currentOrganization && lastPhoneForOrganization[currentOrganization]) {
                    // inherit phone number from organization
                    row["Phone No."] = lastPhoneForOrganization[currentOrganization];
                }
                
                return row;
            });
            
            // second pass: filter out headers and create auditor objects
            allAuditors = rowsWithInheritedData
                .filter(row => !row.isHeader && row["Auditor Name"] && row["Auditor Name"].trim() !== "")
                .map((row, index) => {
                    const auditor = {
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
                        regions: row["Local government areas of service"] || "N/A",
                        // set auditor type based on which section they're in
                        auditorType: row.auditorType
                    };
                    
                    // debug logging for each auditor
                    console.log("Created auditor:", auditor.name, "Type:", auditor.auditorType);
                    return auditor;
                });

            // setup region dropdown and display initial data
            const uniqueRegions = getUniqueRegions(allAuditors);
            populateRegionDropdown(uniqueRegions);

            // render all auditors initially
            renderAuditors(allAuditors);
        } catch (parseErr) {
            console.error("Error parsing Excel data:", parseErr);
            alert("Error parsing the Excel file. The file format may have changed. Please contact support.");
        }
    }

    // ------------------ QG COMPONENT VISIBILITY FIXES ------------------

    // Helper to toggle a target element by selector
    function toggleElement(selector, forceShow = null) {
        const el = document.querySelector(selector);
        if (!el) return;

        const isCollapsed = !el.classList.contains("show");

        if (forceShow === true || (forceShow === null && isCollapsed)) {
        el.classList.add("show");
        el.classList.remove("collapse");
        el.style.display = "block";
        } else if (forceShow === false || !isCollapsed) {
        el.classList.remove("show");
        el.classList.add("collapse");
        el.style.display = "none";
        }
    }

    // Mobile menu toggle ("Menu" button)
    const menuBtn = document.querySelector("#qg-show-menu");
    if (menuBtn) {
        menuBtn.addEventListener("click", (e) => {
        e.preventDefault();
        toggleElement("#qg-site-nav");
        toggleElement("#qg-portal-links");
        });
    }

    // Search bar toggle ("Search" button)
    const searchBtn = document.querySelector("#qg-show-search");
    if (searchBtn) {
        searchBtn.addEventListener("click", (e) => {
        e.preventDefault();
        toggleElement("#qg-global-search-form");
        });
    }

    // Portal links dropdown toggle
    const portalDropdown = document.querySelector("#qgPortalLinkBusiness");
    if (portalDropdown) {
        portalDropdown.addEventListener("click", (e) => {
        e.preventDefault();
        const dropdownMenu = portalDropdown.parentElement.querySelector(".dropdown-menu");
        if (dropdownMenu) {
            const visible = dropdownMenu.classList.toggle("show");
            dropdownMenu.style.display = visible ? "block" : "none";
        }
        });
    }

    const govDropdown = document.querySelector("#qgPortalLinkGovernment");
    if (govDropdown) {
        govDropdown.addEventListener("click", (e) => {
        e.preventDefault();
        const dropdownMenu = govDropdown.parentElement.querySelector(".dropdown-menu");
        if (dropdownMenu) {
            const visible = dropdownMenu.classList.toggle("show");
            dropdownMenu.style.display = visible ? "block" : "none";
        }
        });
    }

    // Initialize collapsed elements so they show properly
    ["#qg-site-nav", "#qg-portal-links", "#qg-global-search-form"].forEach(sel => {
        const el = document.querySelector(sel);
        if (el && el.classList.contains("collapse")) {
        el.classList.remove("collapse");
        el.classList.add("show");
        el.style.display = "block";
        }
    });

    // // Make header search button visible locally
    // document.addEventListener("DOMContentLoaded", () => {
    // const headerSearchBtn = document.querySelector("#feature-search-submit");
    // if (headerSearchBtn) {
    //     // Un-hide (QGOV hides it using clipping)
    //     headerSearchBtn.style.position = "static";
    //     headerSearchBtn.style.clip = "auto";
    //     headerSearchBtn.style.height = "auto";
    //     headerSearchBtn.style.width = "auto";
    //     headerSearchBtn.style.overflow = "visible";
    //     headerSearchBtn.style.whiteSpace = "normal";
    //     headerSearchBtn.style.display = "inline-block";
    // }
    // });

    // ------------------ END QG COMPONENT VISIBILITY FIXES ------------------
    
    // start loading data
    loadExcelData();

});