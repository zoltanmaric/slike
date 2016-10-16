// Check for the various File API support.
if (window.File && window.FileReader && window.FileList && window.Blob) {
    // Great success! All the File APIs are supported.
} else {
    alert('The File APIs are not fully supported in this browser.');
}

function initializeFileListeners(onFileLoaded) {
    // Setup the dnd listeners.
    var dropZone = document.getElementById('drop_zone');
    dropZone.addEventListener('dragover', handleDragOver, false);
    dropZone.addEventListener('drop', handleFileSelect(onFileLoaded), false);
}

function handleFileSelect(onFileLoaded) {
    return function(evt) {
        evt.stopPropagation();
        evt.preventDefault();

        var files = evt.dataTransfer.files; // FileList object.
        console.log('files: ' + JSON.stringify(files, null, 2));

        // files is a FileList of File objects. List some properties.
        var output = [];
        for (var i = 0, f; f = files[i]; i++) {
            console.log('file: ' + JSON.stringify(f.lastModifiedDate, null, 2));
            output.push('<li><strong>', escape(f.name), '</strong> (', f.type || 'n/a', ') - ',
                f.size, ' bytes, last modified: ',
                f.lastModifiedDate ? f.lastModifiedDate.toLocaleDateString() : 'n/a',
                '</li>');

            var reader = new FileReader();

            reader.onload = onFileLoaded(f.name);

            reader.readAsArrayBuffer(f);
        }
        document.getElementById('list').innerHTML = '<ul>' + output.join('') + '</ul>';
    };
}

function handleDragOver(evt) {
    evt.stopPropagation();
    evt.preventDefault();
    evt.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
}
