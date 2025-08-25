const fileInput = document.getElementById('fileElem');
const fileSelect = document.getElementById('fileSelect');
const previewList = document.getElementById('preview-list');
const addMoreBtn = document.getElementById('add-more-btn');
const clearBtn = document.getElementById('clear-btn');
const convertBtn = document.getElementById('convert-btn');
const resultDiv = document.getElementById('result');

let filesArr = [];

fileSelect.addEventListener('click', () => fileInput.click());
addMoreBtn.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', (e) => {
    filesArr = filesArr.concat([...e.target.files]);
    renderList();
});

clearBtn.addEventListener('click', () => {
    filesArr = [];
    renderList();
});

function renderList() {
    previewList.innerHTML = '';
    filesArr.forEach((file, idx) => {
        const li = document.createElement('li');
        li.className = 'item';

        const img = document.createElement('img');
        img.className = 'thumb';
        img.src = URL.createObjectURL(file);
        img.style.transform = `rotate(${file.rotation || 0}deg)`;

        const info = document.createElement('div');
        info.className = 'info';
        info.innerHTML = `<div>${file.name}</div><div>${(file.size/1024).toFixed(2)} KB</div>`;

        const actions = document.createElement('div');
        actions.className = 'actions';

        const rotateBtn = document.createElement('button');
        rotateBtn.className = 'btn secondary small';
        rotateBtn.textContent = '↻ Rotate';
        rotateBtn.onclick = () => {
            file.rotation = (file.rotation || 0) + 90;
            if (file.rotation >= 360) file.rotation = 0;
            renderList();
        };

        const removeBtn = document.createElement('button');
        removeBtn.className = 'btn danger small';
        removeBtn.textContent = 'Remove';
        removeBtn.onclick = () => {
            filesArr.splice(idx, 1);
            renderList();
        };

        actions.appendChild(rotateBtn);
        actions.appendChild(removeBtn);

        li.appendChild(img);
        li.appendChild(info);
        li.appendChild(actions);
        previewList.appendChild(li);
    });
}

convertBtn.addEventListener('click', () => {
    if (filesArr.length === 0) {
        alert('Please select images first.');
        return;
    }

    const fd = new FormData();
    filesArr.forEach((f, i) => {
        fd.append('images', f, f.name);
        fd.append(`rotation_${i}`, f.rotation || 0);
    });
    fd.append('page_size', document.getElementById('pageSize').value);
    fd.append('orientation', document.getElementById('orientation').value);
    fd.append('compression', document.getElementById('compression').value);

    fetch('/convert', { method: 'POST', body: fd })
        .then(res => res.json())
        .then(data => {
            if (data.error) {
                resultDiv.innerHTML = `<div class="error">${data.error}</div>`;
            } else {
                resultDiv.innerHTML = `<div class="success">PDF Ready (${data.size}) <a href="/download/${data.file}">Download</a></div>`;
            }
        });
});
