// initialize and read previously created notes and groups
window.addEventListener('load', () => {  
    document.getElementById('move-to-all').addEventListener('click', () => {
        moveToFolder('noteAppStorageKey0000folder');
    });

    if(localStorage.getItem('noteAppStorageKey0000folder') === null) {
        let storeString = JSON.stringify(
            {folderName: "AllItems", folders: 0, notes: 0}
        );
        localStorage.setItem("noteAppStorageKey0000folder", storeString);
    }
    
    const allStorageValue = JSON.parse(localStorage.getItem("noteAppStorageKey0000folder"));
    document.getElementById('all-notes-count').innerHTML = 
    `${Number(allStorageValue.notes)} Notes |`;
    document.getElementById('all-folders-count').innerHTML = 
    `${Number(allStorageValue.folders)} Groups`;

    let storageKeys = Object.keys(localStorage);
    for(let key of storageKeys) {
        if(!key.includes("noteAppStorageKey")) continue;
        const storageValue = JSON.parse(localStorage.getItem(key));
        if(key.includes("folder")) {
            if(localStorage.getItem(key).includes("AllItems")) continue;
            folderHandler.folderCreator(storageValue.folderName, key, true);
        } else {
            noteHandler.noteCreator(storageValue.noteName, null, key, storageValue.index);
        }
    }
});

// update displayed number of notes
function noteCounter(num) { 
    const allStorageValue = JSON.parse(localStorage.getItem("noteAppStorageKey0000folder"));
    allStorageValue.notes += num; 
    localStorage.setItem(
        "noteAppStorageKey0000folder", 
        JSON.stringify(allStorageValue)
    );
    document.getElementById('all-notes-count').innerHTML = `${allStorageValue.notes} Notes |`;
} 
// update displayed number of groups
function folderCounter(num) {
    const allStorageValue = JSON.parse(localStorage.getItem("noteAppStorageKey0000folder"));
    allStorageValue.folders += num; 
    localStorage.setItem(
        "noteAppStorageKey0000folder", 
        JSON.stringify(allStorageValue)
    );
    document.getElementById('all-folders-count').innerHTML = `${allStorageValue.folders} Groups`;
} 

// note-related functionalities
const noteHandler = {
    noteEditor : document.getElementById('edit-area-container'),
    newNoteTitle : document.getElementById('new-note-name'),
    newNoteText : document.getElementById('new-note-text'),
    notes : {},
    toMoveItemKey : null,
    toEditItemKey : null,
    editMode : 0, // initialize mode(0), create mode(1), edit mode(2) 

    openNoteEditor() {
        folderHandler.closeFolderCreate();
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
        noteDiv.remove();
        delete this.notes[`${noteIndex}`];
        localStorage.removeItem(noteMemKey);
    },

    // initialize moving note to group
    toMove(noteMemKey) {
        event.stopPropagation();
        this.closeNoteEditor();
        folderHandler.closeFolderCreate();
        this.toMoveItemKey = noteMemKey;
        folderHandler.folderMoveParent.style.transform = "scale(1) translate(-50%, 0)";
    },

    // note edit and create function
    noteCreator(noteName, noteText, prevKey, prevIndex) {
        if(noteName === "") {
            this.newNoteTitle.placeholder = "Title can't be empty!";
            return undefined;
        }

        // when editing an existing note
        if(this.editMode == 2) {
            const storageValue = JSON.parse(localStorage.getItem(this.toEditItemKey));
            storageValue.noteName = noteName;
            storageValue.noteText = noteText;
            localStorage.setItem(this.toEditItemKey, JSON.stringify(storageValue));

            this.notes[`${storageValue.index}`].childNodes[1].innerHTML = noteName;
            this.closeNoteEditor();
            return undefined;
        }
    
        let index;
        let k;
        if(this.editMode == 1) {
            let d = new Date();
            k = `noteAppStorageKey${d.getTime()}`;
            index = "note" + `${Object.keys(this.notes).length}`;
            let storeString = JSON.stringify(
                {index: index, noteName: noteName, noteText:noteText, Fldr:"AllItems"}
            );
            localStorage.setItem(k, storeString);
            
            noteCounter(1);
        } else {
            k = prevKey;
            index = prevIndex;
        }

        // create note DOM element
        let noteContainer = document.createElement('div');
        noteContainer.setAttribute('class', "note");
        noteContainer.innerHTML = 
        `<span class="material-symbols-outlined item-type-icon">edit_note</span>` + 
        `<span class="note-title">${noteName}</span>` +
        '<span class="material-symbols-outlined note-move" title="Move Note">drive_file_move</span>' + 
        '<span class="material-symbols-outlined note-delete" title="Delete Note">delete</span>';

        document.getElementById('memos-container').appendChild(noteContainer);
        
        // save note DOM element with unique index for later proccessing
        this.notes[`${index}`] = noteContainer;

        // assign note event handlers
        noteContainer.childNodes[3].addEventListener('click', () => {
            noteHandler.delNote(noteContainer, index, k);
        });
        noteContainer.childNodes[2].addEventListener('click', () => {
            noteHandler.toMove(k);
        });
        noteContainer.addEventListener('click', () => {
            showNote(k);
        });    
    
        this.closeNoteEditor();
    }
};

// note-related event handlers
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

// Groups-related functionalities
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

    closeFolderCreate() {
        this.folderCreatorContainer.style.transform = "scale(0) translate(-50%, 0)";
        this.newFolderName.placeholder = "Group Name";
        this.newFolderName.value = "";
    },

    delFolder(folderItself, moveFolderItem, folderMemKey) {
        event.stopPropagation();
        folderCounter(-1);
        folderItself.remove();
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
            key = `noteAppStorageKey${d.getTime()}folder`;

            let storeString = JSON.stringify(
                {index: index, folderName: folderName}
            );
            localStorage.setItem(key, storeString);
            folderCounter(1);
        } else {
            key = prevKey;
        }
        let folderContainer = document.createElement('div');
        let noteToFolderItem = document.createElement('div');
        
        // create group DOM element
        folderContainer.setAttribute('class', "folder");
        noteToFolderItem.setAttribute('class', "folder-move-item");

        folderContainer.innerHTML = 
        `<span class="material-symbols-outlined item-type-icon">folder</span>`+
        `<span class="folder-name">${folderName}</span>` +
        '<span class="material-symbols-outlined folder-delete" title="Delete Group">delete</span>';
        noteToFolderItem.innerHTML = folderName;
    
        document.getElementById('memos-container').insertBefore(folderContainer, 
        document.getElementById('all-notes-div').nextSibling);
        this.folderMoveParent.appendChild(noteToFolderItem);

        // save group DOM element with unique index for later proccessing
        this.folders.push(folderContainer);
    
        // assign group event handlers
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
    
        this.closeFolderCreate();
    }
};

// group-related event handlers
document.getElementById('cancel-move-btn').addEventListener('click', () => {
    folderHandler.closeMove();
});

document.getElementById('new-folder-btn').addEventListener('click', () => {
    folderHandler.openFolderCreator();
});

document.getElementById('cancel-folder-btn').addEventListener('click', () => {
    folderHandler.closeFolderCreate();
});

document.getElementById('create-folder-btn').addEventListener('click', () => {
    folderHandler.folderCreator(folderHandler.newFolderName.value, 0, null, false);
});

// move selected note to group
function moveToFolder(folderKey) {
    const folderStorageValue = JSON.parse(localStorage.getItem(folderKey));
    const noteStorageValue = JSON.parse(localStorage.getItem(noteHandler.toMoveItemKey));
    if(folderStorageValue.folderName === noteStorageValue.Fldr) {
        folderHandler.closeMove();
        return undefined
    }
    let storeString = JSON.stringify({
            index: noteStorageValue.index,
            noteName: noteStorageValue.noteName,
            noteText: noteStorageValue.noteText,
            Fldr: folderStorageValue.folderName
        }
    );
    localStorage.setItem(noteHandler.toMoveItemKey, storeString);
    folderHandler.closeMove();
}

// show/edit existing note
function showNote(noteMemKey) {
    const storageValue = JSON.parse(localStorage.getItem(noteMemKey));
    let noteName = storageValue.noteName;
    let noteText = storageValue.noteText;
    noteHandler.newNoteTitle.value = noteName;
    noteHandler.newNoteText.value = noteText;
    noteHandler.toEditItemKey = noteMemKey;
    noteHandler.editMode = 2;
    noteHandler.openNoteEditor();
}

// filter notes by group name or search term
function filterNotes(field, term) {
    let storageKeys = Object.keys(localStorage);
    let filterIndices = [];
    let regex = new RegExp(term, "i");
    for(let key of storageKeys) {
        if(key.includes("folder") || !key.includes("noteAppStorageKey")) continue;
        const storageValue = JSON.parse(localStorage.getItem(key));
        let fieldValue = storageValue[field];

        if(fieldValue.search(regex) !== -1) {
            filterIndices.push(storageValue.index);
        }
    }
    for(let key in noteHandler.notes) {
        noteHandler.notes[key].style.display = "none";
    }
    filterIndices.forEach(val => {
        noteHandler.notes[val].style.display = "block";
    });
}
// handle search bar
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
    folderHandler.closeFolderCreate();
    folderHandler.closeMove();
});
document.getElementById('search-box').addEventListener('keyup', invokeSearch);

// show all notes
document.getElementById('all-notes-div').addEventListener('click', () => {
    for(let elem in noteHandler.notes) {
        noteHandler.notes[elem].style.display = "block";
    }
    folderHandler.folders.forEach(elem => {
        elem.style.display = "block";
    });
});

//Dark-light mode toggle
document.getElementById('light-dark-div').onclick = () => {
    const dark = document.getElementById('light-dark-switch').checked;
    let r = document.querySelector(':root');
    if(!dark) {
        r.style.setProperty('--bg_color', 'rgb(34, 39, 46)');
        r.style.setProperty('--list_hover_bg', 'rgb(48, 55, 65)');
        r.style.setProperty('--font_color', 'white');
        r.style.setProperty('--text_color', 'white');
        r.style.setProperty('--icon_color', 'white');
    } else {
        r.style.setProperty('--bg_color', 'white');
        r.style.setProperty('--list_hover_bg', '#ddd');
        r.style.setProperty('--font_color', 'black');
        r.style.setProperty('--text_color', 'black');
        r.style.setProperty('--icon_color', '#333');
    }  
};