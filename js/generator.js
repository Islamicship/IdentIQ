'use strict';

document.addEventListener('DOMContentLoaded', function () {

    if (!document.getElementById('generate-btn')) return;

    var DS = {
        pakistan: {
            prefixes: { Punjab:'33100', Islamabad:'61101', Lahore:'35202', Karachi:'42101', Peshawar:'17101', Quetta:'54401', 'Azad Kashmir':'90202' },
            streets: ['Street 4','Street 11','Main Boulevard','Street 7 Block B','Lane 5','Sector F-7','Block C','Main Bazar Road','College Road','Railway Road','GT Road','Allama Iqbal Road','Garden Avenue','Canal Road'],
            areas: {
                Punjab:         { prov:'Punjab',      places:['Satellite Town, Gujranwala','Peoples Colony, Faisalabad','Cantt, Sialkot','Civil Lines, Multan','Model Town, Gujrat'] },
                Lahore:         { prov:'Punjab',      places:['Model Town','DHA Phase 6','Johar Town','Gulberg III','Bahria Town','Wapda Town','Allama Iqbal Town','Garden Town'] },
                Karachi:        { prov:'Sindh',       places:['Clifton Block 4','Gulshan-e-Iqbal Block 3','DHA Phase 5','North Nazimabad Block H','PECHS Block 6','Bahadurabad'] },
                Islamabad:      { prov:'ICT',         places:['F-7/2','G-11 Markaz','E-11/3','Bahria Enclave Sector B','DHA Phase 2','Blue Area','I-8/4','G-9 Markaz'] },
                Peshawar:       { prov:'KPK',         places:['Hayatabad Phase 3','University Town','Gulbahar No. 2','DHA Peshawar','Saddar Road'] },
                Quetta:         { prov:'Balochistan', places:['Jinnah Town','Zarghoon Road','Cantt Area','Satellite Town','Samungli Road'] },
                'Azad Kashmir': { prov:'AJK',         places:['Sector B-3, Mirpur','Upper Plate, Muzaffarabad','Rawalakot City','New Mirpur City'] }
            }
        },
        india: {
            cities: {
                Mumbai:    { areas:['Andheri West','Bandra East','Kurla West','Malad East','Borivali West','Dadar TT'], pin:[400001,400099] },
                Delhi:     { areas:['Connaught Place','Lajpat Nagar II','Karol Bagh','Rohini Sector 3','Dwarka Sector 6','Saket'], pin:[110001,110097] },
                Bangalore: { areas:['Indiranagar','Koramangala 4th Block','Whitefield','JP Nagar 2nd Phase','Jayanagar','HSR Layout'], pin:[560001,560099] },
                Hyderabad: { areas:['Banjara Hills Road 12','Jubilee Hills','Hitech City','Ameerpet','Secunderabad'], pin:[500001,500090] },
                Chennai:   { areas:['Anna Nagar East','T. Nagar','Velachery','Adyar','Tambaram West'], pin:[600001,600099] }
            },
            bNames: ['Shanti','Gokul','Anand','Krishna','Laxmi','Sai','Raj','Om'],
            bTypes: ['Niwas','Apartments','Residency','Enclave','Heights','Complex','Towers']
        },
        uae: {
            cities: {
                Dubai:       { areas:['Dubai Marina','Downtown Dubai','Al Barsha 1','Jumeirah Village Circle','Business Bay','Deira','Bur Dubai'], buildings:['Marina Heights','Al Attar Tower','Gold Crest','Sulafa Tower','Prime Tower','Mazaya Tower','Damac Heights'] },
                'Abu Dhabi': { areas:['Corniche Road','Khalidiyah','Al Reem Island','Yas Island','Mussafah','Al Nahyan Camp','Khalifa City A'], buildings:['Corniche Tower','Al Bateen Towers','Capital Plaza','Al Maqam Tower','Etihad Towers'] },
                Sharjah:     { areas:['Al Nahda','Al Majaz','Al Qasimia','Muwaileh Commercial','Al Taawun'], buildings:['Al Nahda Tower','Majaz Tower','Blue Tower','City Tower','Rolla Residence'] }
            }
        },
        qatar: {
            cities: {
                Doha:        { zones:[[1,10],[20,30],[40,55],[60,72]], areas:['West Bay','The Pearl','Lusail City','Al Sadd','Al Waab','Msheireb Downtown','Old Airport Road'] },
                'Al Rayyan': { zones:[[80,90],[91,99]], areas:['Al Gharrafa','Aspire Zone','Education City','Al Waab City'] },
                'Al Wakrah': { zones:[[100,115]], areas:['Al Wukair','Barwa City','New Al Wakrah','Ezdan Village'] }
            }
        },
        bangladesh: {
            cities: {
                Dhaka:      { areas:['Gulshan 2','Banani Block E','Dhanmondi 27','Mirpur 10','Uttara Sector 7','Mohammadpur','Bashundhara R/A Block D'], roads:[1,50] },
                Chittagong: { areas:['Agrabad C/A','GEC Circle','Nasirabad H/S','Halishahar','Panchlaish R/A'], roads:[1,30] },
                Sylhet:     { areas:['Zindabazar','Ambarkhana','Tilagor','Shahjalal Upashahar'], roads:[1,20] },
                Rajshahi:   { areas:['Rajpara','Motihar','Boalia','Shaheb Bazar'], roads:[1,15] }
            }
        },
        nepal: {
            cities: {
                Kathmandu:  { areas:['Thamel','Baluwatar','Lazimpat','Baneshwor','Koteshwor','Kalanki','Maharajgunj'], ward:[1,32] },
                Pokhara:    { areas:['Lakeside Ward 6','Prithvi Chowk','Bagar','New Road','Chipledhunga'], ward:[1,33] },
                Lalitpur:   { areas:['Patan Durbar Marg','Imadol','Satdobato','Lagankhel'], ward:[1,29] },
                Biratnagar: { areas:['Traffic Chowk','Golpark','Rangeli Road','Itahari Chowk'], ward:[1,19] }
            }
        },
        afghanistan: {
            cities: {
                Kabul:            { areas:['Shahr-e-Naw','Wazir Akbar Khan','Macroyan Block 1','Karte Char','Karte-e-Se'], districts:['1st','2nd','3rd','4th','5th','6th'] },
                Herat:            { areas:['Guzara District','Injil','Shindand','Pashtun Zarghun'], districts:['1st','2nd','3rd'] },
                'Mazar-i-Sharif': { areas:['Blue Mosque Area','Industrial Zone','Khairkhana'], districts:['1st','2nd','3rd','4th'] },
                Kandahar:         { areas:['Aino Mena','Camp Shaheen','Bazar Area','Daman District'], districts:['1st','2nd','3rd'] }
            }
        },
        saudiarabia: {
            provinces: {
                Riyadh:      { areas:['Al Malaz','Al Olaya','Al Murabba','Ad Dira','Sulaymaniyah','Al Hamra','Uthmaniyyah','King Fahd District','Al Waha','Al Nakheel'] },
                Jeddah:      { areas:['Al Balad','Al Hamra','Al Rawdah','Al Salamah','Al Andalus','Bawadi Mall Area','Al Rehab','Al Khalidiyyah'] },
                Dammam:      { areas:['Al Faisaliyah','Al Khobar Road','Al Anud','Al Fursan','Al Jawhara','Al Shulah','Al Rawabi'] },
                Makkah:      { areas:['Aziziyah','Al Mansur','Al Masfalah','Batha Quraish','Al Sharqiyyah','Al Adl'] },
                Madinah:     { areas:['Al Haram','Al Aziziyah','Quba','Al Anbariyah','Al Munawarrah','Shuran'] },
                Abha:        { areas:['Al Manhal','Al Wurud','Al Khamis','Al Odah','Al Nuzha','Al Murooj'] },
                'Al Khobar': { areas:['Al Aqrabiyah','Al Thuqbah','Al Rakah','Ash Shati','Al Ulaya','Al Bandariyah'] }
            }
        },
        kuwait: {
            areas: {
                'Kuwait City': ['Sharq','Mirqab','Dasman','Qibla','Bneid Al Qar','Dasma','Abdullah Al Salem','Al Salhiya'],
                Salmiya:       ['Block 1','Block 2','Block 3','Block 4','Al Bidaa','Al Jabriyah','Al Surra'],
                Farwaniya:     ['Khaitan','Ardiya','Sabahiya','Rehab','Al Rai','Al Omariya','Fahaheel'],
                Ahmadi:        ['Rumaithiya','Shuaiba','Fintas','Mahboula','Abu Halifa','Mangaf','Hadiya'],
                Hawalli:       ['Salmiya 2','Rumaithiya','Bayan','Mishref','Salwa','Andalus','Rawdah']
            }
        },
        bahrain: {
            areas: {
                Manama:          ['Seef District','Juffair','Diplomatic Area','Adliya','Hoora','Um Al Hassam','Sanabis'],
                Muharraq:        ['Muharraq Centre','Arad','Galali','Al Dair','Hidd','Bu Maher'],
                Riffa:           ['East Riffa','West Riffa','Al Hunainiyah','Al Akar','Hajjiyat'],
                'Northern Area': ['Al Hamala','Budaiya','Jasra','Bani Jamra','Barbar','Diraz','Jannusan'],
                'Southern Area': ['Isa Town','Zallaq','Askar','Jaw','Sitra','Tubli']
            }
        },
        oman: {
            areas: {
                Muscat:   ['Al Khuwair','Al Qurum','Ruwi','Al Mawaleh','Al Wattayah','Azaibah','Al Ghubra','Muttrah','Al Amerat'],
                Salalah:  ['Al Haffa','Al Nahdha','Dahariz','Al Wusta','Awtad','Taqah'],
                Sohar:    ['Falaj Al Qabail','Al Multaqa','Industrial Area','Al Harf','Al Khaboura'],
                Nizwa:    ['Old Nizwa','Al Qalaa','Birkat Al Mouz','Tanuf','Al Izz'],
                'Sur':    ['Al Ayjah','Ras Al Hadd','Al Khaboura','Bilad Sur','Al Sinisla']
            }
        }
    };

    var CITY_MAP = {
        Pakistan:    ['Punjab','Lahore','Karachi','Islamabad','Peshawar','Quetta','Azad Kashmir'],
        India:       ['Mumbai','Delhi','Bangalore','Hyderabad','Chennai'],
        UAE:         ['Dubai','Abu Dhabi','Sharjah'],
        Qatar:       ['Doha','Al Rayyan','Al Wakrah'],
        Bangladesh:  ['Dhaka','Chittagong','Sylhet','Rajshahi'],
        Nepal:       ['Kathmandu','Pokhara','Lalitpur','Biratnagar'],
        Afghanistan: ['Kabul','Herat','Mazar-i-Sharif','Kandahar'],
        SaudiArabia: ['Riyadh','Jeddah','Dammam','Makkah','Madinah','Abha','Al Khobar'],
        Kuwait:      ['Kuwait City','Salmiya','Farwaniya','Ahmadi','Hawalli'],
        Bahrain:     ['Manama','Muharraq','Riffa','Northern Area','Southern Area'],
        Oman:        ['Muscat','Salalah','Sohar','Nizwa','Sur']
    };

    function rand(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
    function pick(arr)  { return arr[Math.floor(Math.random() * arr.length)]; }
    function safeId(n)  { var s=''; for(var i=0;i<n;i++) s+=rand(i===0?1:0,9); return s; }

    var el = {
        country:     document.getElementById('country-select'),
        cityBox:     document.getElementById('city-selection-container'),
        city:        document.getElementById('city-select'),
        genBtn:      document.getElementById('generate-btn'),
        boxes:       document.querySelectorAll('.gen-data-box'),
        out: {
            idNumber:      document.getElementById('id-number'),
            licenseNumber: document.getElementById('license-number'),
            issueDate:     document.getElementById('issue-date'),
            expiryDate:    document.getElementById('expiry-date'),
            fullAddress:   document.getElementById('full-address'),
            currentDate:   document.getElementById('current-date'),
            weekday:       document.getElementById('weekday')
        }
    };

    function updateCityDropdown() {
        var cities = CITY_MAP[el.country.value] || [];
        el.city.innerHTML = '';
        cities.forEach(function (c) {
            var o = document.createElement('option'); o.value = c; o.textContent = c; el.city.appendChild(o);
        });
    }

    function generateData() {
        var country=el.country.value, city=el.city.value;
        var GULF_COUNTRIES = ['UAE','Qatar','SaudiArabia','Kuwait','Bahrain','Oman'];
        var isGulf = GULF_COUNTRIES.indexOf(country) !== -1;
        var issueDate, attempts=0;
        do {
            var m=rand(0,11), maxDay=new Date(2022,m+1,0).getDate(), d=rand(1,maxDay);
            issueDate=new Date(2022,m,d); issueDate.setHours(0,0,0,0); attempts++;
            var day = issueDate.getDay();
            var isWeekend = isGulf ? (day===5||day===6) : (day===0);
        } while(isWeekend && attempts<60);
        var expiryDate=IS.computeExpiryDate(issueDate);
        var idNum='', addr='';

        if (country==='Pakistan') {
            var pref=DS.pakistan.prefixes[city]||'33100', cData=DS.pakistan.areas[city]||DS.pakistan.areas.Punjab;
            idNum=pref+'-'+rand(1000000,9999999)+'-'+rand(1,9);
            addr='House '+rand(1,500)+', '+pick(DS.pakistan.streets)+', '+pick(cData.places)+', '+(city!=='Punjab'?city+', ':'')+cData.prov+', Pakistan';
        } else if (country==='India') {
            var ci=DS.india.cities[city]||DS.india.cities.Mumbai;
            idNum=rand(2000,9999)+' '+rand(1000,9999)+' '+rand(1000,9999);
            addr='Flat '+rand(1,12)+'0'+rand(1,9)+', '+pick(DS.india.bNames)+' '+pick(DS.india.bTypes)+', '+pick(ci.areas)+', '+city+' - '+rand(ci.pin[0],ci.pin[1])+', India';
        } else if (country==='UAE') {
            var cu=DS.uae.cities[city]||DS.uae.cities.Dubai;
            idNum='784-'+rand(1970,2005)+'-'+rand(1000000,9999999)+'-'+rand(1,9);
            addr='Flat '+rand(101,3005)+', '+pick(cu.buildings)+', '+pick(cu.areas)+', '+city+', UAE';
        } else if (country==='Qatar') {
            var cq=DS.qatar.cities[city]||DS.qatar.cities.Doha, zr=pick(cq.zones);
            idNum='2'+rand(80,99)+safeId(7);
            addr='Zone '+rand(zr[0],zr[1])+', Street '+rand(200,999)+', Building '+rand(1,150)+', '+pick(cq.areas)+', '+city+', Qatar';
        } else if (country==='Bangladesh') {
            var cb=DS.bangladesh.cities[city]||DS.bangladesh.cities.Dhaka;
            idNum=safeId(10);
            addr='House '+rand(1,120)+', Road '+IS.pad(rand(cb.roads[0],cb.roads[1]))+', '+pick(cb.areas)+', '+city+', Bangladesh';
        } else if (country==='Nepal') {
            var cn=DS.nepal.cities[city]||DS.nepal.cities.Kathmandu;
            idNum=safeId(8);
            addr='House No. '+rand(1,500)+', Ward '+IS.pad(rand(cn.ward[0],cn.ward[1]))+', '+pick(cn.areas)+', '+city+', Nepal';
        } else if (country==='Afghanistan') {
            var ca=DS.afghanistan.cities[city]||DS.afghanistan.cities.Kabul;
            idNum='19'+rand(85,99)+'-'+rand(1000,9999)+'-'+rand(10000,99999);
            addr='House '+rand(1,300)+', '+pick(ca.districts)+' District, '+pick(ca.areas)+', '+city+', Afghanistan';
        } else if (country==='SaudiArabia') {
            var sp=DS.saudiarabia.provinces[city]||DS.saudiarabia.provinces.Riyadh;
            idNum=pick(['1','2'])+safeId(9);
            addr='Villa '+rand(1,500)+', '+pick(sp.areas)+', '+city+', Kingdom of Saudi Arabia';
        } else if (country==='Kuwait') {
            var kw=DS.kuwait.areas[city]||DS.kuwait.areas['Kuwait City'];
            var ky=rand(1970,2003);
            idNum=ky.toString()+IS.pad(rand(1,12))+IS.pad(rand(1,28))+rand(1000,9999).toString();
            addr='Block '+rand(1,12)+', Street '+rand(1,50)+', Building '+rand(1,120)+', '+pick(kw)+', '+city+', Kuwait';
        } else if (country==='Bahrain') {
            var bh=DS.bahrain.areas[city]||DS.bahrain.areas.Manama;
            idNum=rand(70,99).toString()+IS.pad(rand(1,12))+IS.pad(rand(1,28))+rand(100,999);
            addr='Flat '+rand(1,80)+', Building '+rand(100,9999)+', Road '+rand(100,9999)+', Block '+rand(100,999)+', '+pick(bh)+', '+city+', Bahrain';
        } else if (country==='Oman') {
            var om=DS.oman.areas[city]||DS.oman.areas.Muscat;
            idNum='2'+rand(10000000,99999999);
            addr='Flat '+rand(1,200)+', Building '+rand(1,500)+', Way '+rand(1000,9999)+', '+pick(om)+', '+city+', Sultanate of Oman';
        }

        return {
            idNumber:      idNum,
            licenseNumber: IS.pad(rand(10,99))+'-'+rand(1000,9999),
            issueDate:     IS.fmtDate(issueDate),
            expiryDate:    IS.fmtDate(expiryDate),
            fullAddress:   addr,
            _country:      country,
            _raw:          { issueDate: issueDate, expiryDate: expiryDate }
        };
    }

    var lastData=null;
    var _genTimer=null;
    var GEN_KEYS = ['idNumber','licenseNumber','issueDate','expiryDate','fullAddress'];
    function handleGeneration(){
        clearTimeout(_genTimer);
        el.boxes.forEach(function(b){b.classList.remove('fade-in');b.classList.add('fade-out');});
        _genTimer=setTimeout(function(){
            lastData=generateData();
            GEN_KEYS.forEach(function(k){if(lastData[k]!==undefined&&el.out[k])el.out[k].textContent=lastData[k];});
            el.boxes.forEach(function(b){b.classList.remove('fade-out');void b.offsetWidth;b.classList.add('fade-in');});
        },280);
    }

    function setLiveDate(dateObj){
        var d=dateObj||new Date();
        var eng=IS.pad(d.getDate())+'-'+IS.pad(d.getMonth()+1)+'-'+d.getFullYear();
        if(el.out.weekday) el.out.weekday.textContent=d.toLocaleString('en-US',{weekday:'long'});
        function tryHijri(tries){
            if(window.moment&&typeof window.moment.fn.iYear!=='undefined'){
                var hijri=window.moment(d).format('iDD-iMM-iYYYY');
                if(el.out.currentDate) el.out.currentDate.innerHTML=hijri+'&nbsp;&nbsp;&#8212;<br>'+eng;
            } else if(tries<20){
                setTimeout(function(){tryHijri(tries+1);},400);
            } else {
                if(el.out.currentDate) el.out.currentDate.innerHTML='--/--/----&nbsp;&#8212;<br>'+eng;
                if(!setLiveDate._hijriWatcher){
                    setLiveDate._hijriWatcher=true;
                    var checkInterval=setInterval(function(){
                        if(window.moment&&typeof window.moment.fn.iYear!=='undefined'){
                            clearInterval(checkInterval);
                            setLiveDate._hijriWatcher=false;
                            setLiveDate(d);
                        }
                    },1000);
                    setTimeout(function(){clearInterval(checkInterval);setLiveDate._hijriWatcher=false;},60000);
                }
            }
        }
        tryHijri(0);
    }

    function setupGenCopyBtns(){
        document.querySelectorAll('.gen-copy-btn').forEach(function(btn){
            var tid=btn.getAttribute('data-target');
            IS.setupCopyBtn(btn,function(){
                var s=document.getElementById(tid);
                var val=s?s.innerText.trim():'';
                if(val) IS.showToast('Copied!');
                return val;
            });
        });
    }

    var calPopup=document.getElementById('calPopup'),calOpenBtn=document.getElementById('calOpenBtn'),
        calPrev=document.getElementById('calPrev'),calNext=document.getElementById('calNext'),
        calGrid=document.getElementById('calGrid'),calGregMonth=document.getElementById('calGregMonth'),
        calHijriMonth=document.getElementById('calHijriMonth'),calTodayBtn=document.getElementById('calTodayBtn'),
        calCloseBtn=document.getElementById('calCloseBtn');
    var MONTHS=['January','February','March','April','May','June','July','August','September','October','November','December'];
    var HIJRI_M=['Muharram','Safar','Rabi\u02BC al-Awwal','Rabi\u02BC al-Thani','Jumada al-Awwal','Jumada al-Thani','Rajab','Sha\u02BCban','Ramadan','Shawwal','Dhul Qi\u02BCdah','Dhul Hijjah'];
    var calYear=new Date().getFullYear(),calMonth=new Date().getMonth();
    var today=new Date();today.setHours(0,0,0,0);
    var selectedDate=new Date();selectedDate.setHours(0,0,0,0);

    function hijriFor(date){if(!window.moment||!window.moment.fn.iYear)return null;var m=window.moment(date);return{day:m.iDate(),month:m.iMonth(),year:m.iYear(),monthName:HIJRI_M[m.iMonth()]};}
    function renderCalendar(){
        var fd=new Date(calYear,calMonth,1).getDay(),dc=new Date(calYear,calMonth+1,0).getDate();
        if(calGregMonth)calGregMonth.textContent=MONTHS[calMonth]+' '+calYear;
        if(calHijriMonth){var h1=hijriFor(new Date(calYear,calMonth,1)),h2=hijriFor(new Date(calYear,calMonth,dc));if(h1&&h2)calHijriMonth.textContent=(h1.monthName===h2.monthName)?h1.monthName+' '+h1.year:h1.monthName+' \u2013 '+h2.monthName+' '+h2.year;}
        if(!calGrid)return;calGrid.innerHTML='';
        for(var i=0;i<fd;i++){var bl=document.createElement('div');bl.className='cal-day cal-blank';bl.setAttribute('aria-hidden','true');calGrid.appendChild(bl);}
        for(var day=1;day<=dc;day++){(function(d){
            var dateObj=new Date(calYear,calMonth,d);dateObj.setHours(0,0,0,0);
            var cell=document.createElement('div');cell.className='cal-day';cell.setAttribute('role','gridcell');cell.setAttribute('aria-label',MONTHS[calMonth]+' '+d+' '+calYear);cell.setAttribute('tabindex','0');
            var gs=document.createElement('span');gs.className='cal-greg';gs.textContent=d;cell.appendChild(gs);
            var hInfo=hijriFor(dateObj);if(hInfo){var hs=document.createElement('span');hs.className='cal-hijri-day';hs.textContent=hInfo.day;cell.appendChild(hs);}
            if(dateObj.getTime()===today.getTime())cell.classList.add('cal-today');
            if(selectedDate&&dateObj.getTime()===selectedDate.getTime())cell.classList.add('cal-selected');
            if(dateObj.getDay()===5)cell.classList.add('cal-friday');
            function selectDay(){selectedDate=new Date(calYear,calMonth,d);setLiveDate(selectedDate);closeCalendar();}
            cell.addEventListener('click',selectDay);cell.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' ')selectDay();});
            calGrid.appendChild(cell);
        })(day);}
    }
    function openCalendar(){calYear=(selectedDate||today).getFullYear();calMonth=(selectedDate||today).getMonth();renderCalendar();if(calPopup)calPopup.classList.add('open');setTimeout(function(){document.addEventListener('click',outsideClick);window._calOutsideClick=outsideClick;},10);}
    function closeCalendar(){if(calPopup)calPopup.classList.remove('open');document.removeEventListener('click',outsideClick);window._calOutsideClick=null;}
    function outsideClick(e){var card=document.getElementById('date-card');if(card&&!card.contains(e.target))closeCalendar();}

    document.addEventListener('keydown', function(e) {
        if (!calPopup || !calPopup.classList.contains('open')) return;
        var focused = document.activeElement;
        if (!calGrid || !calGrid.contains(focused)) return;
        var days = Array.from(calGrid.querySelectorAll('.cal-day:not(.cal-blank)'));
        var idx = days.indexOf(focused);
        if (idx === -1) return;
        var newIdx = idx;
        if (e.key === 'ArrowRight') {
            if (idx === days.length - 1) {
                calMonth++; if (calMonth > 11) { calMonth = 0; calYear++; }
                renderCalendar();
                var newDays = Array.from(calGrid.querySelectorAll('.cal-day:not(.cal-blank)'));
                if (newDays[0]) newDays[0].focus();
                e.preventDefault(); return;
            }
            newIdx = idx + 1; e.preventDefault();
        }
        else if (e.key === 'ArrowLeft') {
            if (idx === 0) {
                calMonth--; if (calMonth < 0) { calMonth = 11; calYear--; }
                renderCalendar();
                var newDays = Array.from(calGrid.querySelectorAll('.cal-day:not(.cal-blank)'));
                if (newDays[newDays.length - 1]) newDays[newDays.length - 1].focus();
                e.preventDefault(); return;
            }
            newIdx = idx - 1; e.preventDefault();
        }
        else if (e.key === 'ArrowDown') { newIdx = Math.min(idx + 7, days.length - 1); e.preventDefault(); }
        else if (e.key === 'ArrowUp') { newIdx = Math.max(idx - 7, 0); e.preventDefault(); }
        if (newIdx !== idx) days[newIdx].focus();
    });
    if(calOpenBtn)calOpenBtn.addEventListener('click',function(e){e.stopPropagation();calPopup&&calPopup.classList.contains('open')?closeCalendar():openCalendar();});
    if(calPrev)calPrev.addEventListener('click',function(e){e.stopPropagation();calMonth--;if(calMonth<0){calMonth=11;calYear--;}renderCalendar();});
    if(calNext)calNext.addEventListener('click',function(e){e.stopPropagation();calMonth++;if(calMonth>11){calMonth=0;calYear++;}renderCalendar();});
    if(calTodayBtn)calTodayBtn.addEventListener('click',function(e){e.stopPropagation();selectedDate=new Date();selectedDate.setHours(0,0,0,0);calYear=selectedDate.getFullYear();calMonth=selectedDate.getMonth();setLiveDate(selectedDate);renderCalendar();setTimeout(closeCalendar,300);});
    if(calCloseBtn)calCloseBtn.addEventListener('click',function(e){e.stopPropagation();closeCalendar();});

    el.genBtn.addEventListener('click',handleGeneration);
    el.country.addEventListener('change',function(){updateCityDropdown();handleGeneration();});
    el.city.addEventListener('change',handleGeneration);

    updateCityDropdown();setLiveDate();handleGeneration();setupGenCopyBtns();

});
