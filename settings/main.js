async function loadIntoTable(table) {
    var url = window.location.origin + '/api/activity/shuffle';
    if(window.location.pathname === '/activity/2v2') {
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
        const posChange = item.diff.rank_diff >= 0 ? `+${item.diff.rank_diff}` : item.diff.rank_diff;
        const ratingChange = item.diff.rating_diff >= 0 ? `+${item.diff.rating_diff}` : item.diff.rating_diff;
        row.innerHTML = `<td>${item.character.pos}${posChange}</td>
                         <td>${item.character.full_spec}</td>
                         <td>${item.character.name}</td>
                         <td>${item.character.realm}</td>
                         <td>${item.diff.won}/${item.diff.lost}</td>
                         <td>${item.character.rating}${ratingChange}</td>
                         <td>${data.last_seen}</td>`
    });
}

loadIntoTable(document.querySelector('table'))
    .then(r => console.log(r));