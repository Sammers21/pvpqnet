function mark(markColor, text) {
    return `<mark class="${markColor}">${text}</mark>`;
}

function classNameColored(wowClass, name) {
    wowClass = wowClass.toUpperCase();
    if (wowClass === 'WARRIOR') {
        return mark('tan', name);
    } else if (wowClass === 'PALADIN') {
        return mark('pink', name);
    } else if (wowClass === 'HUNTER') {
        return mark('pistachio', name);
    } else if (wowClass === 'ROGUE') {
        return mark('yellow', name);
    } else if (wowClass === 'PRIEST') {
        return mark('white', name);
    } else if (wowClass === 'DEATH KNIGHT') {
        return mark('dk-red', name);
    } else if (wowClass === 'SHAMAN') {
        return mark('blue', name);
    } else if (wowClass === 'MAGE') {
        return mark('light-blue', name);
    } else if (wowClass === 'WARLOCK') {
        return mark('purple', name);
    } else if (wowClass === 'MONK') {
        return mark('spring-green ', name);
    } else if (wowClass === 'DRUID') {
        return mark('orange', name);
    } else if (wowClass === 'DEMON HUNTER') {
        return mark('dark-magenta ', name);
    } else if (wowClass === 'EVOKER') {
        return mark('dark-emerald ', name);
    } else {
        return mark('white', name);
    }
}

function specNameFromFullSpec(full_spec) {
    return full_spec.trim().replaceAll(" ", "").toLowerCase()
}

function markNumber(number) {
    if (number > 0) {
        return mark('green', '+' + number);
    } else if (number < 0) {
        return mark('red', number);
    } else {
        return mark('white', '+' + number);
    }
}

function rankNumber(number) {
    if (number < 0) {
        return mark('green', number);
    } else if (number > 0) {
        return mark('red', '+' + number);
    } else {
        return mark('white', '+' + number);
    }
}

function addClassToEvenRows(table) {
    var rows = table.rows;
    for (var i = 2, iLen = rows.length; i < iLen; i++) {
        rows[i].className = i % 2 ? '' : 'even';
    }
}

function fillWithDiff(data, table) {
    for(var i = 1;i<table.rows.length;){
        table.deleteRow(i);
    }
    data.characters.forEach((item) => {
        const row = table.insertRow();
        const posChange = rankNumber(item.diff.rank_diff);
        const ratingChange = markNumber(item.diff.rating_diff);
        const won = item.diff.won > 0 ? mark('green', item.diff.won) : mark('white', item.diff.won);
        const lost = item.diff.lost > 0 ? mark('red', item.diff.lost) : mark('white', item.diff.lost);
        var realm;
        if (item.character.fraction === 'ALLIANCE') {
            realm = mark('light-blue', item.character.realm);
        } else {
            realm = mark('red', item.character.realm);
        }
        const name = classNameColored(item.character.class, item.character.name);
        const classImgSrc = window.location.origin + "/classicons/" + item.character.class.replaceAll(" ", "").toLowerCase() + ".png"
        const classImg = `<img class="h-8 w-8" src="${classImgSrc}"/>`;
        const specImgSrc = window.location.origin + "/specicons/" + specNameFromFullSpec(item.character.full_spec) + ".png"
        const specImg = `<img class="h-8 w-8" src="${specImgSrc}"/>`;
        const details = `${classImg}${specImg}`;
        row.innerHTML = `<td>#${item.character.pos} ${posChange}</td>
                         <td>${details}</td>
                         <td>${name}</td>
                         <td>${realm}</td>
                         <td>${won} / ${lost}</td>
                         <td>${item.character.rating} ${ratingChange}</td>
                         <td>${item.diff.last_seen}</td>`
    });
}

function goToRegion(region) {
    var path = window.location.pathname;
    let aolRegion = path.match("/(?<region>eu|us)/(?<aol>ladder|activity)/(?<bracket>2v2|3v3|rbg|shuffle)");
    let aol = path.match("/(?<aol>ladder|activity)/(?<bracket>2v2|3v3|rbg|shuffle)");
    if (aolRegion) {
        window.location.href = window.location.origin + `/${region}/${aolRegion[2]}/${aolRegion[3]}`;
    } else if (aol) {
        window.location.href = window.location.origin + `/${region}/${aol[1]}/${aol[2]}`;
    } else if (path === '/') {
        window.location.href = window.location.origin + `/${region}/activity/shuffle`;
    }
}

function goToBracket(bracket) {
    var path = window.location.pathname;
    let aolRegion = path.match("/(?<region>eu|us)/(?<aol>ladder|activity)/(?<bracket>2v2|3v3|rbg|shuffle)");
    let aol = path.match("/(?<aol>ladder|activity)/(?<bracket>2v2|3v3|rbg|shuffle)");
    if (aolRegion) {
        window.location.href = window.location.origin + `/${aolRegion[1]}/${aolRegion[2]}/${bracket}`;
    } else if (aol) {
        window.location.href = window.location.origin + `/${aol[1]}/${bracket}`;
    } else {
        window.location.href = window.location.origin + `/activity/${bracket}`;
    }
}

async function loadIntoTable(page) {
    var table = document.querySelector('table')
    var region;
    if (window.location.pathname.includes('us')) {
        region = 'en-us';
    } else {
        region = 'en-gb';
    }
    var path = window.location.pathname;
    let aolRegion = path.match("/(?<region>eu|us)/(?<aol>ladder|activity)/(?<bracket>2v2|3v3|rbg|shuffle)");
    let aol = path.match("/(?<aol>ladder|activity)/(?<bracket>2v2|3v3|rbg|shuffle)");
    var url;
    if (aolRegion) {
        if (aolRegion[1] === 'eu') {
            aolRegion[1] = 'en-gb';
        } else {
            aolRegion[1] = 'en-us';
        }
        url = window.location.origin + `/api/${aolRegion[1]}/${aolRegion[2]}/${aolRegion[3]}`;
    } else if (aol) {
        url = window.location.origin + `/api/${region}/${aol[1]}/${aol[2]}`;
    } else {
        url = window.location.origin + `/api/${region}/activity/shuffle`;
    }
    if (page >= 0) {
        url = url + `?page=${page}`;
    }
    console.log("API URL: " + url)
    const response = await fetch(url);
    const data = await response.json();
    console.log(data)
    fillWithDiff(data, table);
    addClassToEvenRows(table);
    const btns = new Map()
    for (let i = 1; i <= data.total_pages; i++) {
        if (i === data.page || i === data.page - 1 || i === data.page + 1 || i === 1 || i === data.total_pages) {
            btns.set(i, `<button type="button" class="page-btn" onclick="loadIntoTable(${i})">${i}</button>`);
        }
        if ((i === data.page - 2 || i === data.page + 2) && i !== 1 && i !== data.total_pages) {
            btns.set(i, `<button type="button" class="page-btn" onclick="loadIntoTable(${i})">...</button>`);
        }
    }
    let elements = document.querySelectorAll('.pagination-buttons');
    for (const pagBtns of elements) {
        pagBtns.innerHTML = Array.from(btns.values()).join(' ');
    }
}

function moveAbleHeader() {
    window.addEventListener('scroll', function (e) {
        var header = document.querySelector('thead');
        header.classList.toggle('sticky', window.scrollY > 0);
    });
}

function makeGrayNonChosenRegion() {
    let aolRegion = window.location.pathname
        .match("/(?<region>eu|us)/(?<aol>ladder|activity)/(?<bracket>2v2|3v3|rbg|shuffle)");
    let regions = ['eu', 'us']
    if (aolRegion) {
        var index = regions.indexOf(aolRegion[1]);
        if (index !== -1) {
            regions.splice(index, 1);
        }
    } else {
        var index = regions.indexOf('eu');
        if (index !== -1) {
            regions.splice(index, 1);
        }
    }
    let regionToMakeGray = regions[0];
    document.querySelector(`.${regionToMakeGray}btn`).classList.add('grayscale');
}

function loadTableWPage() {
    const params = new Proxy(new URLSearchParams(window.location.search), {
        get: (searchParams, prop) => searchParams.get(prop),
    });
    var page = 1;
    let pageParam = params.page;
    if (pageParam) {
        page = pageParam;
    }
    loadIntoTable(page).then(r => console.log(r));
}

moveAbleHeader();
makeGrayNonChosenRegion();
loadTableWPage();
