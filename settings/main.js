async function loadIntoTable(url, table) {
    const response = await fetch(url);
    const data = await response.json();
    println(data)
    data.forEach((item) => {
        const row = table.insertRow();
        row.innerHTML = `<td>${item.id}</td><td>${item.name}</td>`;
    });
}

loadIntoTable('http://161.35.72.39:9000/api/activity/shuffle', document.querySelector('table'));