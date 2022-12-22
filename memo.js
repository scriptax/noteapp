var parentContainer = document.getElementById('memos-container');
var allNotesFolder = document.getElementById('all-notes-div');


window.addEventListener('load', () => {  
    document.getElementById('move-to-all').addEventListener('click', () => {
        moveToFolder('0000folder');
    });

    if(localStorage.getItem('0000folder') === null)
    localStorage.setItem("0000folder", `_folderName:AllItems_folders:0_notes:0`);

    const allStorageValue = readStorage("0000folder");
    document.getElementById('all-notes-count').innerHTML = 
    `${Number(allStorageValue.notes)} Notes |`;
    document.getElementById('all-folders-count').innerHTML = 
    `${Number(allStorageValue.folders)} Groups`;
    

    let storageKeys = Object.keys(localStorage);
    for(let key of storageKeys) {
        if(/^[0-9]/.test) continue;
        const storageValue = readStorage(key);
        if(key.includes("folder")) {
            if(localStorage.getItem(key).includes("AllItems")) continue;
            folderHandler.folderCreator(storageValue.folderName, key, true);
        } else {
            noteHandler.noteCreator(storageValue.noteName, null, key, storageValue.index);
        }
    }
});

function noteCounter(num) {
    const allStorageValue = readStorage("0000folder");
    document.getElementById('all-notes-count').innerHTML = 
    `${Number(allStorageValue.notes) + num} Notes |`;
    localStorage.setItem(
        "0000folder", `_folderName:AllItems_folders:${allStorageValue.folders}_notes:${Number(allStorageValue.notes) + num}`
    );
} 
function folderCounter(num) {
    const allStorageValue = readStorage("0000folder");
    document.getElementById('all-folders-count').innerHTML = 
    `${Number(allStorageValue.folders) + num} Groups`;
    localStorage.setItem(
        "0000folder", `_folderName:AllItems_folders:${Number(allStorageValue.folders) + num}_notes:${allStorageValue.notes}`
    );
} 

const noteHandler = {
    noteEditor : document.getElementById('edit-area-container'),
    newNoteTitle : document.getElementById('new-note-name'),
    newNoteText : document.getElementById('new-note-text'),
    notes : {},
    toMoveItemKey : null,
    toEditItemKey : null,
    editMode : 0,

    openNoteEditor() {
        folderHandler.cancelFolderCreate();
        folderHandler.closeMove();
        this.noteEditor.style.transform = "scale(1) translate(-50%, 0)";
    },

    closeNoteEditor() {
        this.noteEditor.style.transform = "scale(0) translate(-50%, 0)";
        this.newNoteTitle.placeholder = "Title";
        this.newNoteTitle.value = "";
        this.newNoteText.value = "";
    },
    
    delNote(noteDiv, noteIndex,noteMemKey) {
        event.stopPropagation();
        noteCounter(-1);
        parentContainer.removeChild(noteDiv);
        delete this.notes[`${noteIndex}`];
        localStorage.removeItem(noteMemKey);
    },

    toMove(noteMemKey) {
        event.stopPropagation();
        this.closeNoteEditor();
        folderHandler.cancelFolderCreate();
        this.toMoveItemKey = noteMemKey;
        folderHandler.folderMoveParent.style.transform = "scale(1) translate(-50%, 0)";
    },

    noteCreator(noteName, noteText, prevKey, prevIndex) {
        if(noteName === "") {
            this.newNoteTitle.placeholder = "Title can't be empty!";
            return undefined;
        }

        if(this.editMode == 2) {
            const storageValue = readStorage(this.toEditItemKey);
            writeStorage.note(
                this.toEditItemKey,
                storageValue.index,
                noteName,
                noteText,
                storageValue.Fldr
                );
            this.notes[`${storageValue.index}`].childNodes[1].innerHTML = noteName;
            this.closeNoteEditor();
            return undefined;
        }
    
        let index;
        let k;
        if(this.editMode == 1) {
            let d = new Date();
            k = d.getTime();
            index = "note" + `${Object.keys(this.notes).length}`;
            writeStorage.note(k, index, noteName, noteText, "AllItems");

            noteCounter(1);
        } else {
            k = prevKey;
            index = prevIndex;
        }

        let noteContainer = document.createElement('div');
        noteContainer.setAttribute('class', "note");
        noteContainer.innerHTML = 
        `<span class="material-symbols-outlined item-type-icon">description</span>` + 
        `<span class="note-title">${noteName}</span>` +
        '<span class="material-symbols-outlined note-move" title="Move Note">drive_file_move</span>' + 
        '<span class="material-symbols-outlined note-delete" title="Delete Note">delete</span>';

        parentContainer.appendChild(noteContainer);
        
        this.notes[`${index}`] = noteContainer;

        noteContainer.childNodes[3].addEventListener('click', () => {
            noteHandler.delNote(noteContainer, index, k);
        });
        noteContainer.childNodes[2].addEventListener('click', () => {
            noteHandler.toMove(k);
        });
        noteContainer.addEventListener('click', () => {
            showNote(k);
        });    
    
        this.noteEditor.style.transform = "scale(0) translate(-50%, 0)";
        this.newNoteTitle.placeholder = "Title";
        this.newNoteTitle.value = "";
        this.newNoteText.value = "";
    }
};

document.getElementById('new-note-btn').addEventListener('click', () => {
    noteHandler.editMode = 1;
    noteHandler.openNoteEditor();
});

document.getElementById('discard-note-btn').addEventListener('click', () => {
    noteHandler.closeNoteEditor();
});

document.getElementById('create-note-btn').addEventListener('click', () => {
    noteHandler.noteCreator(
        noteHandler.newNoteTitle.value,
        noteHandler.newNoteText.value, null, null
    );
});

const folderHandler = {
    folderCreatorContainer : document.getElementById('create-folder-div'),
    newFolderName : document.getElementById('new-folder-name'),
    folderMoveParent : document.getElementById('folder-move-div'),
    folders : [],

    closeMove() {
        this.folderMoveParent.style.transform = "scale(0) translate(-50%, 0)";
    },

    openFolderCreator() {
        this.closeMove();
        noteHandler.closeNoteEditor();
        this.folderCreatorContainer.style.transform = "scale(1) translate(-50%, 0)";
    },

    cancelFolderCreate() {
        this.folderCreatorContainer.style.transform = "scale(0) translate(-50%, 0)";
        this.newFolderName.placeholder = "Group Name";
        this.newFolderName.value = "";
    },

    delFolder(folderItself, moveFolderItem, folderMemKey) {
        event.stopPropagation();
        folderCounter(-1);
        parentContainer.removeChild(folderItself);
        this.folderMoveParent.removeChild(moveFolderItem);
        localStorage.removeItem(folderMemKey);
    },

    folderCreator(folderName, prevKey, init) {
        if(folderName === "") {
            folderName.placeholder = "Name can't be empty!";
            return undefined;
        }

        let index = this.folders.length;
        let key;
        if(!init) {
            let d = new Date();
            let k = d.getTime();
            key = k + "folder";
            writeStorage.folder(key, index, folderName);
            folderCounter(1);
        } else {
            key = prevKey;
        }
        let folderContainer = document.createElement('div');
        let noteToFolderItem = document.createElement('div');
        
        folderContainer.setAttribute('class', "folder");
        noteToFolderItem.setAttribute('class', "folder-move-item");

        folderContainer.innerHTML = 
        `<span class="material-symbols-outlined item-type-icon">folder</span>`+
        `<span class="folder-name">${folderName}</span>` +
        '<span class="material-symbols-outlined folder-delete" title="Delete Note">delete</span>';
        noteToFolderItem.innerHTML = folderName;
    
        parentContainer.insertBefore(folderContainer, allNotesFolder.nextSibling);
        this.folderMoveParent.appendChild(noteToFolderItem);

        this.folders.push(folderContainer);
    
        folderContainer.childNodes[2].addEventListener('click', () => {
            folderHandler.delFolder(folderContainer, noteToFolderItem, key);
        });

        folderContainer.addEventListener('click', () => {
            filterNotes("Fldr", folderName);
            this.folders.forEach(elem => {
                elem.style.display = "none";
            });
        });
    
        noteToFolderItem.addEventListener('click', () => {
            moveToFolder(key, index);
        });
    
        this.folderCreatorContainer.style.transform = "scale(0) translate(-50%, 0)";
        this.newFolderName.placeholder = "Group Name";
        this.newFolderName.value = "";
    }
};

document.getElementById('cancel-move-btn').addEventListener('click', () => {
    folderHandler.closeMove();
});

document.getElementById('new-folder-btn').addEventListener('click', () => {
    folderHandler.openFolderCreator();
});

document.getElementById('cancel-folder-btn').addEventListener('click', () => {
    folderHandler.cancelFolderCreate();
});

document.getElementById('create-folder-btn').addEventListener('click', () => {
    folderHandler.folderCreator(folderHandler.newFolderName.value, 0, null, false);
});

function moveToFolder(folderKey) {
    const folderStorageValue = readStorage(folderKey);
    const noteStorageValue = readStorage(noteHandler.toMoveItemKey);
    if(folderStorageValue.folderName === noteStorageValue.Fldr) {
        folderHandler.closeMove();
        return undefined
    }
    writeStorage.note(
        noteHandler.toMoveItemKey,
        noteStorageValue.index,
        noteStorageValue.noteName,
        noteStorageValue.noteText,
        folderStorageValue.folderName
    );
    folderHandler.closeMove();
}

function showNote(noteMemKey) {
    const storageValue = readStorage(noteMemKey);
    let noteName = storageValue.noteName;
    let noteText = storageValue.noteText;
    noteHandler.newNoteTitle.value = noteName;
    noteHandler.newNoteText.value = noteText;
    noteHandler.toEditItemKey = noteMemKey;
    noteHandler.editMode = 2;
    noteHandler.openNoteEditor();
}

function filterNotes(field, term) {
    let storageKeys = Object.keys(localStorage);
    let filterIndices = [];
    let regex = new RegExp(term, "i");
    for(let key of storageKeys) {
        if(key.includes("folder")) continue;
        const storageValue = readStorage(key);
        let fieldValue = storageValue[`${field}`];

        if(fieldValue.search(regex) != -1) {
            filterIndices.push(storageValue.index);
        }
    }
    for(let key in noteHandler.notes) {
        noteHandler.notes[`${key}`].style.display = "none";
    }
    filterIndices.forEach(val => {
        noteHandler.notes[`${val}`].style.display = "block";
    });
}

allNotesFolder.addEventListener('click', () => {
    for(let elem in noteHandler.notes) {
        noteHandler.notes[`${elem}`].style.display = "block";
    }
    folderHandler.folders.forEach(elem => {
        elem.style.display = "block";
    });
});

const invokeSearch = (function() {
    let timer = 0;
    return function() {
        clearTimeout(timer);
        timer = setTimeout(() => {
            let term = document.getElementById('search-box').value;
            filterNotes("noteName", term);
        }, 1000);
    }
})();
document.getElementById('search-box').addEventListener('click', () => {
    noteHandler.closeNoteEditor();
    folderHandler.cancelFolderCreate();
    folderHandler.closeMove();
});
document.getElementById('search-box').addEventListener('keyup', invokeSearch);

function readStorage(storageKey) {
    let storageValue = localStorage.getItem(storageKey);
    let start = 0;
    const startIndices = [];
    const endIndices = [];
    while(storageValue.includes(':', start)) {
        let startIndex = storageValue.indexOf('_', start);
        let endIndex = storageValue.indexOf(':', start);
        startIndices.push(startIndex);
        endIndices.push(endIndex);
        start = endIndex + 1;
    }

    const obj = {};
    for(let i = 0; i < startIndices.length; i++) {
        let prop =  storageValue.slice(startIndices[i] + 1, endIndices[i]);
        let value = storageValue.slice(endIndices[i] + 1, startIndices[i + 1]);
        obj[`${prop}`] = value;
    }
    return obj;
}

const writeStorage = {
    note: function(key, index, noteName, noteText, Fldr) {
        let writestr = 
        `_index:${index}_noteName:${noteName}_noteText:${noteText}_Fldr:${Fldr}`;
        localStorage.setItem(key, writestr);
    },
    folder: function (key, index, folderName) {
        let writestr = 
        `_index:${index}_folderName:${folderName}`;
        localStorage.setItem(key, writestr);
    }
};

//Dark-light mode toggle
document.getElementById('light-dark-div').onclick = () => {
    const btnState = document.getElementById('light-dark-switch').checked;
    let r = document.querySelector(':root');
    if(!btnState) {
        r.style.setProperty('--bg_color', 'rgb(34, 39, 46)');
        r.style.setProperty('--list_hover_bg', 'rgb(48, 55, 65)');
        r.style.setProperty('--font_color', 'white');
        r.style.setProperty('--text_color', 'white');
    } else {
        r.style.setProperty('--bg_color', 'white');
        r.style.setProperty('--list_hover_bg', '#ddd');
        r.style.setProperty('--font_color', 'black');
        r.style.setProperty('--text_color', 'black');
    }  
};