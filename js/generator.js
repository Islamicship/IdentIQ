"use strict";

document.addEventListener("DOMContentLoaded", function() {
    if (!document.getElementById("generate-btn")) return;
    var DS = {
        pakistan: {
            prefixes: {
                Punjab: "33100", Islamabad: "61101", Lahore: "35202", Karachi: "42101",
                Peshawar: "17101", Quetta: "54401", "Azad Kashmir": "90202"
            },
            regions: {
                Islamabad: {
                    sectors: ["F-6/2", "F-7/2", "F-8/3", "F-10/2", "F-11/1", "G-9/2", "G-10/3", "G-11/2", "I-8/2", "I-8/4"],
                    postal: "44000"
                },
                Lahore: {
                    areas: [
                        { name: "DHA Phase 5", blocks: ["Sector A", "Sector B", "Sector C"], postal: "54792" },
                        { name: "DHA Phase 6", blocks: ["Sector J", "Sector K", "Sector L"], postal: "54792" },
                        { name: "Johar Town", blocks: ["Block G", "Block H", "Block R"], postal: "54782" },
                        { name: "Model Town", blocks: ["Block A", "Block C", "Block M"], postal: "54700" },
                        { name: "Gulberg III", blocks: ["Block B2", "Block L", "Block P"], postal: "54660" }
                    ]
                },
                Karachi: {
                    areas: [
                        { name: "DHA", streets: ["Khayaban-e-Shamsheer", "Khayaban-e-Badban", "Khayaban-e-Hafiz"], blocks: ["Phase 5", "Phase 6"], postal: "75500" },
                        { name: "Clifton", streets: ["Khayaban-e-Iqbal", "Shahrah-e-Iran", "Clifton Road"], blocks: ["Block 2", "Block 4", "Block 5"], postal: "75600" },
                        { name: "Gulshan-e-Iqbal", streets: ["University Road", "Sir Shah Suleman Road", "Rashid Minhas Road"], blocks: ["Block 3", "Block 6", "Block 13-D"], postal: "75300" },
                        { name: "PECHS", streets: ["Shahrah-e-Faisal", "Tariq Road", "Khalid Bin Waleed Road"], blocks: ["Block 2", "Block 6"], postal: "75400" }
                    ]
                },
                Punjab: {
                    cities: [
                        { city: "Gujranwala", area: "Satellite Town", streets: ["Civil Lines Road", "Sialkot Road", "Main Market Street"], postal: "52250" },
                        { city: "Faisalabad", area: "Peoples Colony No. 1", streets: ["Jaranwala Road", "Chenab Club Road", "Main Boulevard"], postal: "38000" },
                        { city: "Sialkot", area: "Cantt", streets: ["Kashmir Road", "Mall Road", "Paris Road"], postal: "51310" },
                        { city: "Multan", area: "Civil Lines", streets: ["Abdali Road", "Bosan Road", "Nusrat Road"], postal: "60000" },
                        { city: "Gujrat", area: "Model Town", streets: ["Bhimber Road", "GT Road", "Court Road"], postal: "50700" }
                    ]
                },
                Peshawar: {
                    areas: [
                        { name: "Hayatabad", sectors: ["Phase 2, Sector F-1", "Phase 3, Sector D-2", "Phase 5, Sector K-3"], postal: "25100" },
                        { name: "University Town", sectors: ["Park Avenue", "Circular Road", "Sufaid Dheri Road"], postal: "25000" },
                        { name: "Gulbahar", sectors: ["Gulbahar No. 2", "Gulbahar No. 4"], postal: "25000" }
                    ]
                },
                Quetta: {
                    areas: [
                        { name: "Jinnah Town", streets: ["Samungli Road", "Airport Road", "Main Boulevard"], postal: "87300" },
                        { name: "Cantt Area", streets: ["Staff College Road", "Zarghoon Road", "Halifax Road"], postal: "87300" }
                    ]
                },
                "Azad Kashmir": {
                    areas: [
                        { city: "Mirpur", area: "New Mirpur City", streets: ["Sector B-3", "Sector F-1", "Kotli Road"], postal: "10250" },
                        { city: "Muzaffarabad", area: "Upper Plate", streets: ["Neelum Road", "CMH Road", "Secretariat Road"], postal: "13100" }
                    ]
                }
            }
        },
        india: {
            cities: {
                Mumbai: {
                    areas: ["Andheri West", "Bandra West", "Juhu", "Powai", "Worli"],
                    streets: ["Linking Road", "S.V. Road", "Juhu Tara Road", "LBS Marg", "Dr E Moses Road"],
                    pins: ["400053", "400050", "400049", "400076", "400018"]
                },
                Delhi: {
                    areas: ["Connaught Place", "Lajpat Nagar IV", "Vasant Kunj", "Hauz Khas", "Rohini Sector 9"],
                    streets: ["Barakhamba Road", "Ring Road", "Nelson Mandela Marg", "Aurobindo Marg", "Outer Ring Road"],
                    pins: ["110001", "110024", "110070", "110016", "110085"]
                },
                Bangalore: {
                    areas: ["Indiranagar", "Koramangala 4th Block", "Whitefield", "HSR Layout Sector 1"],
                    streets: ["100 Feet Road", "80 Feet Road", "Outer Ring Road", "ITPL Main Road"],
                    pins: ["560038", "560034", "560066", "560102"]
                },
                Hyderabad: {
                    areas: ["Banjara Hills", "Jubilee Hills", "HITEC City", "Gachibowli"],
                    streets: ["Road No. 12", "Road No. 36", "Madhapur Main Road", "ISB Road"],
                    pins: ["500034", "500033", "500081", "500032"]
                },
                Chennai: {
                    areas: ["Anna Nagar East", "T. Nagar", "Adyar", "Velachery"],
                    streets: ["2nd Avenue", "G.N. Chetty Road", "Sardar Patel Road", "Bypass Road"],
                    pins: ["600102", "600017", "600020", "600042"]
                }
            },
            bNames: ["Shanti", "Gokul", "Anand", "Krishna", "Laxmi", "Sai", "Raj", "Om"],
            bTypes: ["Apartments", "Residency", "Enclave", "Heights", "Complex", "Towers"]
        },
        uae: {
            cities: {
                Dubai: {
                    areas: ["Dubai Marina", "Downtown Dubai", "Business Bay", "Jumeirah Village Circle", "Al Barsha 1"],
                    streets: ["Al Marsa Street", "Sheikh Mohammed bin Rashid Blvd", "Marasi Drive", "Al Khail Road", "Al Barsha Road"],
                    buildings: ["Princess Tower", "Silverene Tower", "Burj Crown", "The Executive Towers", "Seasons Community"]
                },
                "Abu Dhabi": {
                    areas: ["Al Reem Island", "Corniche Road", "Al Khalidiyah", "Yas Island"],
                    streets: ["Al Reem Street", "Corniche Street", "Zayed the First Street", "Yas Marina Circuit Rd"],
                    buildings: ["Sun Tower", "Capital Plaza", "Etihad Towers", "Ansam Residence"]
                },
                Sharjah: {
                    areas: ["Al Majaz 2", "Al Nahda", "Al Taawun", "Muwaileh Commercial"],
                    streets: ["Corniche Street", "Al Ittihad Street", "Al Taawun Street", "University City Road"],
                    buildings: ["Al Majaz Tower", "Blue Tower", "Al Sondos Tower", "Sharjah Gate Tower"]
                }
            }
        },
        qatar: {
            cities: {
                Doha: [
                    { area: "West Bay", zone: 60, streets: [840, 850, 860] },
                    { area: "The Pearl-Qatar", zone: 66, streets: [101, 105, 120] },
                    { area: "Al Sadd", zone: 39, streets: [340, 350, 360] },
                    { area: "Old Airport", zone: 45, streets: [710, 720, 730] }
                ],
                "Al Rayyan": [
                    { area: "Al Gharrafa", zone: 51, streets: [780, 790, 800] },
                    { area: "Education City", zone: 52, streets: [210, 220, 230] },
                    { area: "Al Waab", zone: 55, streets: [410, 420, 430] }
                ],
                "Al Wakrah": [
                    { area: "Al Wukair", zone: 90, streets: [610, 620, 630] },
                    { area: "Ezdan Village", zone: 91, streets: [310, 320, 330] }
                ]
            }
        },
        saudiarabia: {
            cities: {
                Riyadh: [
                    { dist: "Al Olaya", street: "King Fahd Branch Rd", postal: "12211" },
                    { dist: "Al Malaz", street: "Salah Ad Din Al Ayyubi Rd", postal: "12831" },
                    { dist: "Al Nakheel", street: "Imam Saud Bin Abdulaziz Rd", postal: "12381" },
                    { dist: "Sulaymaniyah", street: "King Abdulaziz Rd", postal: "12242" }
                ],
                Jeddah: [
                    { dist: "Al Rawdah", street: "Prince Mohammed Bin Abdulaziz St", postal: "23432" },
                    { dist: "Al Hamra", street: "Al Andalus Rd", postal: "23212" },
                    { dist: "Al Salamah", street: "Al Madinah Al Munawwarah Rd", postal: "23436" }
                ],
                Dammam: [
                    { dist: "Al Faisaliyah", street: "King Fahd Rd", postal: "32272" },
                    { dist: "Al Rawabi", street: "Prince Nayef Bin Abdulaziz Rd", postal: "32242" }
                ],
                Makkah: [
                    { dist: "Aziziyah", street: "Masjid Al Haram Rd", postal: "24243" },
                    { dist: "Batha Quraish", street: "Al Hijrah Rd", postal: "24352" }
                ],
                Madinah: [
                    { dist: "Al Haram", street: "King Faisal Rd", postal: "42311" },
                    { dist: "Quba", street: "Hijrah Rd", postal: "42315" }
                ],
                Abha: [
                    { dist: "Al Manhal", street: "King Abdulaziz Rd", postal: "62521" },
                    { dist: "Al Murooj", street: "King Khalid Rd", postal: "62527" }
                ],
                "Al Khobar": [
                    { dist: "Al Ulaya", street: "Prince Faisal Bin Fahd Rd", postal: "34448" },
                    { dist: "Al Aqrabiyah", street: "Al Yarmouk St", postal: "34446" }
                ]
            }
        },
        kuwait: {
            areas: {
                "Kuwait City": ["Sharq", "Mirqab", "Dasman", "Qibla"],
                Salmiya: ["Block 4", "Block 7", "Baghdad Street Area", "Arabian Gulf St Area"],
                Farwaniya: ["Khaitan", "Ardiya", "Al Rai", "Ishbiliya"],
                Ahmadi: ["Fintas", "Mahboula", "Mangaf", "Abu Halifa"],
                Hawalli: ["Bayan", "Mishref", "Salwa", "Jabriya"]
            }
        },
        bahrain: {
            areas: {
                Manama: [
                    { area: "Seef District", block: "428" },
                    { area: "Juffair", block: "324" },
                    { area: "Adliya", block: "338" }
                ],
                Muharraq: [
                    { area: "Busaiteen", block: "228" },
                    { area: "Arad", block: "243" },
                    { area: "Hidd", block: "111" }
                ],
                Riffa: [
                    { area: "East Riffa", block: "901" },
                    { area: "West Riffa", block: "912" }
                ],
                "Northern Area": [
                    { area: "Budaiya", block: "550" },
                    { area: "Janabiyah", block: "575" },
                    { area: "Saar", block: "525" }
                ],
                "Southern Area": [
                    { area: "Isa Town", block: "809" },
                    { area: "Zallaq", block: "1056" }
                ]
            }
        },
        oman: {
            areas: {
                Muscat: [
                    { area: "Al Khuwair", pc: "133" },
                    { area: "Al Qurum", pc: "112" },
                    { area: "Ruwi", pc: "112" },
                    { area: "Azaiba", pc: "130" }
                ],
                Salalah: [
                    { area: "Al Haffa", pc: "211" },
                    { area: "Dahariz", pc: "214" }
                ],
                Sohar: [
                    { area: "Falaj Al Qabail", pc: "322" },
                    { area: "Al Multaqa", pc: "311" }
                ],
                Nizwa: [
                    { area: "Birkat Al Mouz", pc: "612" },
                    { area: "Firq", pc: "611" }
                ],
                Sur: [
                    { area: "Al Ayjah", pc: "411" },
                    { area: "Bilad Sur", pc: "411" }
                ]
            }
        },
        bangladesh: {
            cities: {
                Dhaka: [
                    { area: "Gulshan 2", thana: "Gulshan", sec: "Block NW", pc: "1212" },
                    { area: "Banani", thana: "Banani", sec: "Block E", pc: "1213" },
                    { area: "Dhanmondi", thana: "Dhanmondi", sec: "Road 27", pc: "1205" },
                    { area: "Uttara", thana: "Uttara", sec: "Sector 7", pc: "1230" }
                ],
                Chittagong: [
                    { area: "Agrabad C/A", thana: "Double Mooring", sec: "Commercial Area", pc: "4100" },
                    { area: "Nasirabad", thana: "Panchlaish", sec: "Housing Society", pc: "4203" }
                ],
                Sylhet: [
                    { area: "Zindabazar", thana: "Kotwali", sec: "Main Market", pc: "3100" },
                    { area: "Shahjalal Upashahar", thana: "Shah Paran", sec: "Block B", pc: "3104" }
                ],
                Rajshahi: [
                    { area: "Shaheb Bazar", thana: "Boalia", sec: "Central Road", pc: "6100" },
                    { area: "Motihar", thana: "Motihar", sec: "University Area", pc: "6204" }
                ]
            }
        },
        nepal: {
            cities: {
                Kathmandu: [
                    { tole: "Thamel Marg", ward: 26, pc: "44600" },
                    { tole: "Baluwatar Chowk", ward: 4, pc: "44606" },
                    { tole: "Lazimpat", ward: 2, pc: "44600" },
                    { tole: "New Baneshwor", ward: 10, pc: "44600" }
                ],
                Pokhara: [
                    { tole: "Lakeside Marg", ward: 6, pc: "33700" },
                    { tole: "Prithvi Chowk", ward: 9, pc: "33700" },
                    { tole: "Chipledhunga", ward: 4, pc: "33700" }
                ],
                Lalitpur: [
                    { tole: "Patan Durbar Marg", ward: 16, pc: "44700" },
                    { tole: "Pulchowk Road", ward: 3, pc: "44700" },
                    { tole: "Kupondole", ward: 1, pc: "44700" }
                ],
                Biratnagar: [
                    { tole: "Traffic Chowk", ward: 7, pc: "56613" },
                    { tole: "Main Road", ward: 9, pc: "56613" }
                ]
            }
        },
        afghanistan: {
            cities: {
                Kabul: [
                    { area: "Shahr-e-Naw", nahia: 4 },
                    { area: "Wazir Akbar Khan", nahia: 10 },
                    { area: "Karte Char", nahia: 3 },
                    { area: "Macroyan 3", nahia: 9 }
                ],
                Herat: [
                    { area: "Guzara District Area", nahia: 2 },
                    { area: "Injil Road Area", nahia: 3 },
                    { area: "Sarak-e-Welayat", nahia: 1 }
                ],
                "Mazar-i-Sharif": [
                    { area: "Rawza Area", nahia: 1 },
                    { area: "Khairkhana", nahia: 3 },
                    { area: "Karti Ariana", nahia: 4 }
                ],
                Kandahar: [
                    { area: "Aino Mena", nahia: 11 },
                    { area: "Shahre Naw", nahia: 2 },
                    { area: "Dand Road", nahia: 5 }
                ]
            }
        }
    
    };
    var CITY_MAP = {
        Pakistan: [ "Punjab", "Lahore", "Karachi", "Islamabad", "Peshawar", "Quetta", "Azad Kashmir" ],
        India: [ "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai" ],
        UAE: [ "Dubai", "Abu Dhabi", "Sharjah" ],
        Qatar: [ "Doha", "Al Rayyan", "Al Wakrah" ],
        Bangladesh: [ "Dhaka", "Chittagong", "Sylhet", "Rajshahi" ],
        Nepal: [ "Kathmandu", "Pokhara", "Lalitpur", "Biratnagar" ],
        Afghanistan: [ "Kabul", "Herat", "Mazar-i-Sharif", "Kandahar" ],
        SaudiArabia: [ "Riyadh", "Jeddah", "Dammam", "Makkah", "Madinah", "Abha", "Al Khobar" ],
        Kuwait: [ "Kuwait City", "Salmiya", "Farwaniya", "Ahmadi", "Hawalli" ],
        Bahrain: [ "Manama", "Muharraq", "Riffa", "Northern Area", "Southern Area" ],
        Oman: [ "Muscat", "Salalah", "Sohar", "Nizwa", "Sur" ]
    };
    function rand(a, b) {
        return Math.floor(Math.random() * (b - a + 1)) + a;
    }
    function pick(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }
    function safeId(n) {
        var s = "";
        for (var i = 0; i < n; i++) s += rand(i === 0 ? 1 : 0, 9);
        return s;
    }
    var WEEKEND = {
        Pakistan: [ 0 ], India: [ 0 ], Bangladesh: [ 5, 6 ], Nepal: [ 6 ], Afghanistan: [ 5 ],
        UAE: [ 0, 6 ], Qatar: [ 5, 6 ], SaudiArabia: [ 5, 6 ], Kuwait: [ 5, 6 ], Bahrain: [ 5, 6 ], Oman: [ 5, 6 ]
    };
    function pickIssueDate(weekend) {
        var start = new Date(2023, 0, 2);
        var end = new Date(2023, 11, 31);
        var span = Math.round((end - start) / 864e5);
        var d, tries = 0;
        do {
            d = new Date(2023, 0, 2 + rand(0, span));
            tries++;
        } while (weekend.indexOf(d.getDay()) !== -1 && tries < 60);
        while (weekend.indexOf(d.getDay()) !== -1) d.setDate(d.getDate() - 1);
        return d;
    }
    function padN(n, len) {
        var t = String(n);
        while (t.length < len) t = "0" + t;
        return t;
    }
    var QID_NAT = [ "586", "356", "050", "524", "004", "634", "818", "608" ];
    function qatarQid() {
        var y = rand(1970, 2003);
        return (y >= 2000 ? "3" : "2") + padN(y % 100, 2) + pick(QID_NAT) + padN(rand(0, 99999), 5);
    }
    var KW_W = [ 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2 ];
    function kuwaitCivilId() {
        for (var n = 0; n < 200; n++) {
            var y = rand(1970, 2003);
            var body = (y >= 2000 ? "3" : "2") + padN(y % 100, 2) + padN(rand(1, 12), 2) + padN(rand(1, 28), 2) + padN(rand(0, 9999), 4);
            var sum = 0;
            for (var i = 0; i < 11; i++) sum += KW_W[i] * (body.charCodeAt(i) - 48);
            var chk = 11 - (sum % 11);
            if (chk <= 9) return body + chk;
        }
        return "2900101000" + "01";
    }
    var el = {
        country: document.getElementById("country-select"),
        cityBox: document.getElementById("city-selection-container"),
        city: document.getElementById("city-select"),
        genBtn: document.getElementById("generate-btn"),
        boxes: document.querySelectorAll(".gen-data-box"),
        out: {
            idNumber: document.getElementById("id-number"),
            licenseNumber: document.getElementById("license-number"),
            issueDate: document.getElementById("issue-date"),
            expiryDate: document.getElementById("expiry-date"),
            fullAddress: document.getElementById("full-address"),
            currentDate: document.getElementById("current-date"),
            weekday: document.getElementById("weekday")
        }
    };
    function updateCityDropdown() {
        var cities = CITY_MAP[el.country.value] || [];
        el.city.innerHTML = "";
        cities.forEach(function(c) {
            var o = document.createElement("option");
            o.value = c;
            o.textContent = c;
            el.city.appendChild(o);
        });
    }
    function generateData() {
        var country = el.country.value, city = el.city.value;
        var issueDate = pickIssueDate(WEEKEND[country] || [ 0 ]);
        var expiryDate = IS.computeExpiryDate(issueDate);
        var idNum = "", addr = "";

        if (country === "Pakistan") {
            var pref = DS.pakistan.prefixes[city] || "33100";
            idNum = pref + "-" + rand(1e6, 9999999) + "-" + rand(1, 9);
            
            if (city === "Islamabad") {
                var isb = DS.pakistan.regions.Islamabad;
                addr = "House " + rand(1, 150) + ", Street " + rand(1, 80) + ", Sector " + pick(isb.sectors) + ", Islamabad " + isb.postal + ", Pakistan";
            } else if (city === "Lahore") {
                var lhArea = pick(DS.pakistan.regions.Lahore.areas);
                addr = "House " + rand(1, 400) + ", Street " + rand(1, 30) + ", " + pick(lhArea.blocks) + ", " + lhArea.name + ", Lahore " + lhArea.postal + ", Pakistan";
            } else if (city === "Karachi") {
                var khiArea = pick(DS.pakistan.regions.Karachi.areas);
                addr = "House " + rand(1, 250) + ", " + pick(khiArea.streets) + ", " + pick(khiArea.blocks) + ", " + khiArea.name + ", Karachi " + khiArea.postal + ", Pakistan";
            } else if (city === "Punjab") {
                var pjCity = pick(DS.pakistan.regions.Punjab.cities);
                addr = "House " + rand(1, 300) + ", " + pick(pjCity.streets) + ", " + pjCity.area + ", " + pjCity.city + ", Punjab " + pjCity.postal + ", Pakistan";
            } else if (city === "Peshawar") {
                var pshArea = pick(DS.pakistan.regions.Peshawar.areas);
                addr = "House " + rand(1, 250) + ", Street " + rand(1, 20) + ", " + pick(pshArea.sectors) + ", " + pshArea.name + ", Peshawar " + pshArea.postal + ", Pakistan";
            } else if (city === "Quetta") {
                var qtaArea = pick(DS.pakistan.regions.Quetta.areas);
                addr = "House " + rand(1, 180) + ", " + pick(qtaArea.streets) + ", " + qtaArea.name + ", Quetta " + qtaArea.postal + ", Pakistan";
            } else if (city === "Azad Kashmir") {
                var ajkArea = pick(DS.pakistan.regions["Azad Kashmir"].areas);
                addr = "House " + rand(1, 150) + ", " + pick(ajkArea.streets) + ", " + ajkArea.area + ", " + ajkArea.city + ", Azad Kashmir " + ajkArea.postal + ", Pakistan";
            }
        } else if (country === "India") {
            var indCity = DS.india.cities[city] || DS.india.cities.Mumbai;
            var indIdx = rand(0, indCity.areas.length - 1);
            idNum = rand(2e3, 9999) + " " + rand(1e3, 9999) + " " + rand(1e3, 9999);
            addr = "Flat " + rand(101, 1404) + ", " + pick(DS.india.bNames) + " " + pick(DS.india.bTypes) + ", " + indCity.streets[indIdx] + ", " + indCity.areas[indIdx] + ", " + city + " - " + indCity.pins[indIdx] + ", India";
        } else if (country === "UAE") {
            var uaeCity = DS.uae.cities[city] || DS.uae.cities.Dubai;
            var uaeIdx = rand(0, uaeCity.areas.length - 1);
            idNum = "784-" + rand(1970, 2005) + "-" + rand(1e6, 9999999) + "-" + rand(1, 9);
            addr = "Apt " + rand(101, 2505) + ", " + pick(uaeCity.buildings) + ", " + uaeCity.streets[uaeIdx % uaeCity.streets.length] + ", " + uaeCity.areas[uaeIdx] + ", " + city + ", PO Box " + rand(11111, 99999) + ", UAE";
        } else if (country === "Qatar") {
            var qatList = DS.qatar.cities[city] || DS.qatar.cities.Doha;
            var qatItem = pick(qatList);
            idNum = qatarQid();
            addr = "Building " + rand(1, 180) + ", Street " + pick(qatItem.streets) + ", Zone " + qatItem.zone + ", " + qatItem.area + ", " + city + ", Qatar";
        } else if (country === "SaudiArabia") {
            var ksaList = DS.saudiarabia.cities[city] || DS.saudiarabia.cities.Riyadh;
            var ksaItem = pick(ksaList);
            idNum = pick([ "1", "2" ]) + safeId(9);
            addr = rand(2000, 8999) + " " + ksaItem.street + ", " + ksaItem.dist + ", " + city + " " + ksaItem.postal + ", Kingdom of Saudi Arabia";
        } else if (country === "Kuwait") {
            var kwList = DS.kuwait.areas[city] || DS.kuwait.areas["Kuwait City"];
            idNum = kuwaitCivilId();
            addr = "Building " + rand(1, 120) + ", Street " + rand(1, 50) + ", Block " + rand(1, 12) + ", " + pick(kwList) + ", " + city + ", Kuwait";
        } else if (country === "Bahrain") {
            var bhList = DS.bahrain.areas[city] || DS.bahrain.areas.Manama;
            var bhItem = pick(bhList);
            idNum = rand(70, 99).toString() + IS.pad(rand(1, 12)) + IS.pad(rand(1, 28)) + rand(100, 999);
            addr = "Flat " + rand(1, 40) + ", Building " + rand(10, 999) + ", Road " + rand(1000, 4999) + ", Block " + bhItem.block + ", " + bhItem.area + ", Kingdom of Bahrain";
        } else if (country === "Oman") {
            var omList = DS.oman.areas[city] || DS.oman.areas.Muscat;
            var omItem = pick(omList);
            idNum = "2" + rand(1e7, 99999999);
            addr = "Building " + rand(10, 450) + ", Way " + rand(1000, 5999) + ", " + omItem.area + ", " + city + ", PC " + omItem.pc + ", Sultanate of Oman";
        } else if (country === "Bangladesh") {
            var bdList = DS.bangladesh.cities[city] || DS.bangladesh.cities.Dhaka;
            var bdItem = pick(bdList);
            idNum = safeId(10);
            addr = "House " + rand(1, 120) + ", Road " + rand(1, 35) + ", " + bdItem.sec + ", " + bdItem.area + ", " + bdItem.thana + ", " + city + " - " + bdItem.pc + ", Bangladesh";
        } else if (country === "Nepal") {
            var npList = DS.nepal.cities[city] || DS.nepal.cities.Kathmandu;
            var npItem = pick(npList);
            idNum = safeId(8);
            addr = "House No. " + rand(1, 450) + ", " + npItem.tole + ", Ward No. " + npItem.ward + ", " + city + " " + npItem.pc + ", Nepal";
        } else if (country === "Afghanistan") {
            var afgList = DS.afghanistan.cities[city] || DS.afghanistan.cities.Kabul;
            var afgItem = pick(afgList);
            idNum = "19" + rand(85, 99) + "-" + rand(1e3, 9999) + "-" + rand(1e4, 99999);
            addr = "House " + rand(1, 200) + ", Street " + rand(1, 15) + ", Gozar " + rand(1, 8) + ", " + afgItem.area + ", Nahia " + afgItem.nahia + ", " + city + ", Afghanistan";
        }

        return {
            idNumber: idNum,
            licenseNumber: IS.pad(rand(10, 99)) + "-" + rand(1e3, 9999),
            issueDate: IS.fmtDate(issueDate),
            expiryDate: IS.fmtDate(expiryDate),
            fullAddress: addr,
            _country: country,
            _raw: {
                issueDate: issueDate,
                expiryDate: expiryDate
            }
        };
    }
    var lastData = null;
    var _genTimer = null;
    var GEN_KEYS = [ "idNumber", "licenseNumber", "issueDate", "expiryDate", "fullAddress" ];
    function handleGeneration() {
        clearTimeout(_genTimer);
        el.boxes.forEach(function(b) {
            b.classList.remove("fade-in");
            b.classList.add("fade-out");
        });
        _genTimer = setTimeout(function() {
            lastData = generateData();
            GEN_KEYS.forEach(function(k) {
                if (lastData[k] !== undefined && el.out[k]) el.out[k].textContent = lastData[k];
            });
            el.boxes.forEach(function(b) {
                b.classList.remove("fade-out");
                void b.offsetWidth;
                b.classList.add("fade-in");
            });
        }, 280);
    }
    var _hijriTimer = null, _hijriStart = 0, _hijriPending = null, _liveReq = 0;
    function hijriReady() {
        return !!(window.moment && window.moment.fn && typeof window.moment.fn.iYear !== "undefined");
    }
    function whenHijriReady(cb) {
        if (hijriReady()) {
            cb();
            return;
        }
        _hijriPending = cb;
        if (_hijriTimer) return;
        _hijriStart = Date.now();
        _hijriTimer = setInterval(function() {
            var ready = hijriReady();
            if (!ready && Date.now() - _hijriStart < 6e4) return;
            clearInterval(_hijriTimer);
            _hijriTimer = null;
            var run = _hijriPending;
            _hijriPending = null;
            if (ready && run) run();
        }, 400);
    }
    function setLiveDate(dateObj) {
        var d = dateObj || new Date;
        var eng = IS.pad(d.getDate()) + "-" + IS.pad(d.getMonth() + 1) + "-" + d.getFullYear();
        var req = ++_liveReq;
        if (el.out.weekday) el.out.weekday.textContent = d.toLocaleString("en-US", {
            weekday: "long"
        });
        function paint(hijri) {
            if (req !== _liveReq || !el.out.currentDate) return;
            el.out.currentDate.innerHTML = hijri + "&nbsp;&nbsp;&#8212;<br>" + eng;
        }
        if (hijriReady()) {
            paint(window.moment(d).locale("en").format("iDD-iMM-iYYYY"));
        } else {
            paint("--/--/----");
            whenHijriReady(function() {
                paint(window.moment(d).locale("en").format("iDD-iMM-iYYYY"));
            });
        }
    }
    function setupGenCopyBtns() {
        document.querySelectorAll(".gen-copy-btn").forEach(function(btn) {
            var tid = btn.getAttribute("data-target");
            IS.setupCopyBtn(btn, function() {
                var s = document.getElementById(tid);
                var val = s ? s.innerText.trim() : "";
                if (val) IS.showToast("Copied!");
                return val;
            });
        });
    }
    var calPopup = document.getElementById("calPopup"), calOpenBtn = document.getElementById("calOpenBtn"), calPrev = document.getElementById("calPrev"), calNext = document.getElementById("calNext"), calGrid = document.getElementById("calGrid"), calGregMonth = document.getElementById("calGregMonth"), calHijriMonth = document.getElementById("calHijriMonth"), calTodayBtn = document.getElementById("calTodayBtn"), calCloseBtn = document.getElementById("calCloseBtn");
    var MONTHS = [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ];
    var HIJRI_M = [ "Muharram", "Safar", "Rabiʼ al-Awwal", "Rabiʼ al-Thani", "Jumada al-Awwal", "Jumada al-Thani", "Rajab", "Shaʼban", "Ramadan", "Shawwal", "Dhul Qiʼdah", "Dhul Hijjah" ];
    var calYear = (new Date).getFullYear(), calMonth = (new Date).getMonth();
    var today = new Date;
    today.setHours(0, 0, 0, 0);
    var selectedDate = new Date;
    selectedDate.setHours(0, 0, 0, 0);
    function hijriFor(date) {
        if (!window.moment || !window.moment.fn.iYear) return null;
        var m = window.moment(date);
        return {
            day: m.iDate(),
            month: m.iMonth(),
            year: m.iYear(),
            monthName: HIJRI_M[m.iMonth()]
        };
    }
    function renderCalendar() {
        var fd = new Date(calYear, calMonth, 1).getDay(), dc = new Date(calYear, calMonth + 1, 0).getDate();
        if (calGregMonth) calGregMonth.textContent = MONTHS[calMonth] + " " + calYear;
        if (calHijriMonth) {
            var h1 = hijriFor(new Date(calYear, calMonth, 1)), h2 = hijriFor(new Date(calYear, calMonth, dc));
            if (h1 && h2) calHijriMonth.textContent = h1.monthName === h2.monthName ? h1.monthName + " " + h1.year : h1.monthName + " – " + h2.monthName + " " + h2.year;
        }
        if (!calGrid) return;
        calGrid.innerHTML = "";
        for (var i = 0; i < fd; i++) {
            var bl = document.createElement("div");
            bl.className = "cal-day cal-blank";
            bl.setAttribute("aria-hidden", "true");
            calGrid.appendChild(bl);
        }
        for (var day = 1; day <= dc; day++) {
            (function(d) {
                var dateObj = new Date(calYear, calMonth, d);
                dateObj.setHours(0, 0, 0, 0);
                var cell = document.createElement("div");
                cell.className = "cal-day";
                cell.setAttribute("role", "gridcell");
                cell.setAttribute("aria-label", MONTHS[calMonth] + " " + d + " " + calYear);
                cell.setAttribute("tabindex", "0");
                var gs = document.createElement("span");
                gs.className = "cal-greg";
                gs.textContent = d;
                cell.appendChild(gs);
                var hInfo = hijriFor(dateObj);
                if (hInfo) {
                    var hs = document.createElement("span");
                    hs.className = "cal-hijri-day";
                    hs.textContent = hInfo.day;
                    cell.appendChild(hs);
                }
                if (dateObj.getTime() === today.getTime()) cell.classList.add("cal-today");
                if (selectedDate && dateObj.getTime() === selectedDate.getTime()) cell.classList.add("cal-selected");
                if (dateObj.getDay() === 5) cell.classList.add("cal-friday");
                function selectDay() {
                    selectedDate = new Date(calYear, calMonth, d);
                    setLiveDate(selectedDate);
                    closeCalendar();
                }
                cell.addEventListener("click", selectDay);
                cell.addEventListener("keydown", function(e) {
                    if (e.key === "Enter" || e.key === " ") selectDay();
                });
                calGrid.appendChild(cell);
            })(day);
        }
    }
    var _calOutsideTimer = null;
    function onCalKeydown(e) {
        if (!calPopup || !calPopup.classList.contains("open")) return;
        var focused = document.activeElement;
        if (!calGrid || !calGrid.contains(focused)) return;
        var days = Array.from(calGrid.querySelectorAll(".cal-day:not(.cal-blank)"));
        var idx = days.indexOf(focused);
        if (idx === -1) return;
        var newIdx = idx, newDays;
        if (e.key === "ArrowRight") {
            if (idx === days.length - 1) {
                calMonth++;
                if (calMonth > 11) {
                    calMonth = 0;
                    calYear++;
                }
                renderCalendar();
                newDays = Array.from(calGrid.querySelectorAll(".cal-day:not(.cal-blank)"));
                if (newDays[0]) newDays[0].focus();
                e.preventDefault();
                return;
            }
            newIdx = idx + 1;
            e.preventDefault();
        } else if (e.key === "ArrowLeft") {
            if (idx === 0) {
                calMonth--;
                if (calMonth < 0) {
                    calMonth = 11;
                    calYear--;
                }
                renderCalendar();
                newDays = Array.from(calGrid.querySelectorAll(".cal-day:not(.cal-blank)"));
                if (newDays[newDays.length - 1]) newDays[newDays.length - 1].focus();
                e.preventDefault();
                return;
            }
            newIdx = idx - 1;
            e.preventDefault();
        } else if (e.key === "ArrowDown") {
            newIdx = Math.min(idx + 7, days.length - 1);
            e.preventDefault();
        } else if (e.key === "ArrowUp") {
            newIdx = Math.max(idx - 7, 0);
            e.preventDefault();
        } else if (e.key === "Escape") {
            closeCalendar();
            if (calOpenBtn) calOpenBtn.focus();
            return;
        }
        if (newIdx !== idx) days[newIdx].focus();
    }
    function openCalendar() {
        calYear = (selectedDate || today).getFullYear();
        calMonth = (selectedDate || today).getMonth();
        renderCalendar();
        if (calPopup) calPopup.classList.add("open");
        clearTimeout(_calOutsideTimer);
        _calOutsideTimer = setTimeout(function() {
            document.addEventListener("click", outsideClick);
        }, 10);
        document.addEventListener("keydown", onCalKeydown);
    }
    function closeCalendar() {
        if (calPopup) calPopup.classList.remove("open");
        clearTimeout(_calOutsideTimer);
        document.removeEventListener("click", outsideClick);
        document.removeEventListener("keydown", onCalKeydown);
    }
    function outsideClick(e) {
        var card = document.getElementById("date-card");
        if (card && !card.contains(e.target)) closeCalendar();
    }
    if (calOpenBtn) calOpenBtn.addEventListener("click", function(e) {
        e.stopPropagation();
        calPopup && calPopup.classList.contains("open") ? closeCalendar() : openCalendar();
    });
    if (calPrev) calPrev.addEventListener("click", function(e) {
        e.stopPropagation();
        calMonth--;
        if (calMonth < 0) {
            calMonth = 11;
            calYear--;
        }
        renderCalendar();
    });
    if (calNext) calNext.addEventListener("click", function(e) {
        e.stopPropagation();
        calMonth++;
        if (calMonth > 11) {
            calMonth = 0;
            calYear++;
        }
        renderCalendar();
    });
    if (calTodayBtn) calTodayBtn.addEventListener("click", function(e) {
        e.stopPropagation();
        selectedDate = new Date;
        selectedDate.setHours(0, 0, 0, 0);
        calYear = selectedDate.getFullYear();
        calMonth = selectedDate.getMonth();
        setLiveDate(selectedDate);
        renderCalendar();
        setTimeout(closeCalendar, 300);
    });
    if (calCloseBtn) calCloseBtn.addEventListener("click", function(e) {
        e.stopPropagation();
        closeCalendar();
    });
    el.genBtn.addEventListener("click", handleGeneration);
    el.country.addEventListener("change", function() {
        updateCityDropdown();
        handleGeneration();
    });
    el.city.addEventListener("change", handleGeneration);
    updateCityDropdown();
    setLiveDate();
    handleGeneration();
    setupGenCopyBtns();
});