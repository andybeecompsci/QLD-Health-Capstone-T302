document.addEventListener("DOMContentLoaded", function () {
    // sully do excel implementation here:
    // 1. create a function to read the excel file
    // 2. convert excel data to match the structure below
    // 3. replace this mock data with your excel data
    
    // mock data for now
    const auditors = [
        {
            id: 1,
            name: "Makis Galanos",
            registrationNumber: "FSA/0255",
            company: "Intertek SAI Global",
            phone: "0479 118 586",
            email: "makis.galanos@optusnet.com.au",
            certifications: {
                standard: "NA",
                cookChill: "NA",
                heatTreatment: "NA",
            },
            regions:
                "Cairns & Hinterland, Cape & Torres, Central Queensland, Darling Downs, Gold Coast, Mackay, Metro North, Metro South, North West, Sunshine Coast, Townsville.",
        },
        {
            id: 2,
            name: "Sarah Thompson",
            registrationNumber: "FSA/0312",
            company: "Food Safety Queensland",
            phone: "0432 555 123",
            email: "s.thompson@foodsafetyqld.com.au",
            certifications: {
                scopes: "High Risk, Cook Chill, Heat Treatment",
            },
            regions: "Brisbane, Gold Coast, Sunshine Coast, Metro North",
        },
        {
            id: 3,
            name: "James Chen",
            registrationNumber: "FSA/0289",
            company: "Australian Food Safety Consultants",
            phone: "0445 789 012",
            email: "james.chen@afsc.com.au",
            certifications: {
                standard: "Yes",
                cookChill: "No",
                heatTreatment: "Yes",
            },
            regions: "Metro South, Darling Downs, Townsville, Mackay",
        },
    ];

    // function to render auditor cards
    function renderAuditors(auditorList) {
        const resultsContainer = document.getElementById("results-container");
        resultsContainer.innerHTML = "";

        auditorList.forEach((auditor) => {
            // create result card
            const card = document.createElement("div");
            card.className = "result-card";

            // create header
            const header = document.createElement("div");
            header.className = "result-header";

            const name = document.createElement("h3");
            name.textContent = auditor.name;

            const regNumber = document.createElement("span");
            regNumber.className = "registration-number";
            regNumber.textContent = auditor.registrationNumber;

            header.appendChild(name);
            header.appendChild(regNumber);

            // create content
            const content = document.createElement("div");
            content.className = "result-content";

            const grid = document.createElement("div");
            grid.className = "result-grid";

            // company info
            const companyInfo = document.createElement("div");
            companyInfo.className = "company-info";

            const companyName = document.createElement("p");
            companyName.className = "info-label";
            companyName.textContent = auditor.company;

            const contactInfo = document.createElement("div");
            contactInfo.className = "info-value";

            const phone = document.createElement("p");
            phone.textContent = `Phone: ${auditor.phone}`;

            const email = document.createElement("p");
            email.textContent = `Email: ${auditor.email}`;

            contactInfo.appendChild(phone);
            contactInfo.appendChild(email);

            companyInfo.appendChild(companyName);
            companyInfo.appendChild(contactInfo);

            // certification info
            const certInfo = document.createElement("div");
            certInfo.className = "certification-info";

            const certTitle = document.createElement("p");
            certTitle.className = "info-label";
            certTitle.textContent = "Certifications";

            const certDetails = document.createElement("div");
            certDetails.className = "info-value";

            if ("scopes" in auditor.certifications) {
                const scopes = document.createElement("p");
                scopes.textContent = `Scopes - ${auditor.certifications.scopes}`;
                certDetails.appendChild(scopes);
            } else {
                const standard = document.createElement("p");
                standard.textContent = `Standard: ${auditor.certifications.standard}`;

                const cookChill = document.createElement("p");
                cookChill.textContent = `Cook Chill: ${auditor.certifications.cookChill}`;

                const heatTreatment = document.createElement("p");
                heatTreatment.textContent = `Heat Treatment: ${auditor.certifications.heatTreatment}`;

                certDetails.appendChild(standard);
                certDetails.appendChild(cookChill);
                certDetails.appendChild(heatTreatment);
            }

            certInfo.appendChild(certTitle);
            certInfo.appendChild(certDetails);

            // region info
            const regionInfo = document.createElement("div");
            regionInfo.className = "region-info";

            const regionTitle = document.createElement("p");
            regionTitle.className = "info-label";
            regionTitle.textContent = "Regions";

            const regionDetails = document.createElement("p");
            regionDetails.className = "info-value";
            regionDetails.textContent = auditor.regions;

            regionInfo.appendChild(regionTitle);
            regionInfo.appendChild(regionDetails);

            // append all sections to grid
            grid.appendChild(companyInfo);
            grid.appendChild(certInfo);
            grid.appendChild(regionInfo);

            // append grid to content
            content.appendChild(grid);

            // append header and content to card
            card.appendChild(header);
            card.appendChild(content);

            // append card to results container
            resultsContainer.appendChild(card);
        });
    }

    // render the cards
    renderAuditors(auditors);

    // todo: add these features later
    // 1. search functionality - filter cards by name or registration number
    // 2. region filter - dropdown to filter by region
    // 3. certification filters - checkboxes to filter by certification types
});