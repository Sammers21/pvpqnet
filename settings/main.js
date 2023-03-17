async function loadIntoTable(url, table) {
    const response = await fetch(url);
    const data = await response.json();
    console.log(data)
    data.characters.forEach((item) => {
        const row = table.insertRow();
        const posChange = item.diff.rank_diff > 0 ? `+${item.diff.rank_diff}` : item.diff.rank_diff;
        const ratingChange = item.diff.rating_diff > 0 ? `+${item.diff.rating_diff}` : item.diff.rating_diff;
        row.innerHTML = `<td>${item.character.pos} ${posChange}</td>
                         <td>${item.character.full_spec}</td>
                         <td>${item.character.name}</td>
                         <td>${item.character.realm}</td>
                         <td>${item.diff.won}/${item.diff.lost}</td>
                         <td>${item.character.rating} ${ratingChange}</td>
                         <td>${data.timestamp}</td>`
    });
}

loadIntoTable('http://localhost:9000/api/activity/shuffle', document.querySelector('table'))
    .then(r => console.log(r));