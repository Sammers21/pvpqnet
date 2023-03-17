async function loadIntoTable(url, table) {
    const response = await fetch(url);
    const data = await response.json();
    console.log(data)
    data.diffs.forEach((item) => {
        console.log(item)
        const row = table.insertRow();
        row.innerHTML = `<td>${item.character.pos}</td>
                         <td>${item.character.full_spec}</td>
                         <td>${item.character.name}</td>
                         <td>${item.character.realm}</td>
                         <td>${item.diff.won}/${item.diff.lost}</td>
                         <td>${item.character.rating}</td>
                         <td>${data.timestamp}</td>`
    });
}

loadIntoTable('http://localhost:9000/api/activity/shuffle', document.querySelector('table'))
    .then(r => console.log(r));