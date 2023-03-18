function mark(markColor, text) {
    return `<mark class="${markColor}">${text}</mark>`;
}

function classNameColored(wowClass, name) {
    wowClass = wowClass.toUpperCase();
    if(wowClass === 'WARRIOR') {
        return mark('tan', name);
    } else if (wowClass === 'PALADIN') {
        return mark('pink', name);
    } else if (wowClass === 'HUNTER') {
        return mark('pistachio', name);
    } else if(wowClass === 'ROGUE') {
        return mark('yellow', name);
    } else if(wowClass === 'PRIEST') {
        return mark('white', name);
    } else if(wowClass === 'DEATH KNIGHT') {
        return mark('dk-red', name);
    } else if(wowClass === 'SHAMAN') {
        return mark('blue', name);
    } else if(wowClass === 'MAGE') {
        return mark('light-blue', name);
    } else if(wowClass === 'WARLOCK') {
        return mark('purple', name);
    } else if(wowClass === 'MONK') {
        return mark('spring-green ', name);
    } else if(wowClass === 'DRUID') {
        return mark('orange', name);
    } else if(wowClass === 'DEMON HUNTER') {
        return mark('dark-magenta ', name);
    } else if(wowClass === 'EVOKER') {
        return mark('dark-emerald ', name);
    } else {
        return mark('white', name);
    }
}

function specNameFromFullSpec(full_spec){
    return full_spec.trim().replaceAll(" ","").toLowerCase()
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

async function loadIntoTable(table) {
    var url = window.location.origin + '/api/activity/shuffle';
    if (window.location.pathname === '/activity/2v2') {
        url = window.location.origin + '/api/activity/2v2';
    } else if (window.location.pathname === '/activity/3v3') {
        url = window.location.origin + '/api/activity/3v3';
    } else if (window.location.pathname === '/activity/rbg') {
        url = window.location.origin + '/api/activity/rbg';
    } else if (window.location.pathname === '/activity/shuffle') {
        url = window.location.origin + '/api/activity/shuffle';
    }
    const response = await fetch(url);
    const data = await response.json();
    console.log(data)
    data.characters.forEach((item) => {
        const row = table.insertRow();
        const posChange = rankNumber(item.diff.rank_diff);
        const ratingChange = markNumber(item.diff.rating_diff);
        const won = item.diff.won > 0 ? mark('green', item.diff.won) : mark('white', item.diff.won);
        const lost = item.diff.lost > 0 ? mark('red', item.diff.lost) : mark('white', item.diff.lost);
        var realm;
        if(item.character.fraction === 'ALLIANCE') {
            realm = mark('light-blue', item.character.realm);
        } else {
            realm = mark('red', item.character.realm);
        }
        const name = classNameColored(item.character.class, item.character.name);
        const classImgSrc = window.location.origin + "/classicons/" + item.character.class.replaceAll(" ", "").toLowerCase() + ".png"
        const classImg = `<img class="h-8 w-8" src="${classImgSrc}"/>`;
        const specImgSrc = window.location.origin + "/specicons/" + specNameFromFullSpec(item.character.full_spec) + ".png"
        const specImg = `<img class="h-8 w-8" src="${specImgSrc}"/>`;
        const details = `${classImg}${specImg}${item.character.full_spec}`;
        row.innerHTML = `<td>#${item.character.pos} ${posChange}</td>
                         <td>${details}</td>
                         <td>${name}</td>
                         <td>${realm}</td>
                         <td>${won} / ${lost}</td>
                         <td>${item.character.rating} ${ratingChange}</td>
                         <td>${item.diff.last_seen}</td>`
    });
}

loadIntoTable(document.querySelector('table'))
    .then(r => console.log(r));