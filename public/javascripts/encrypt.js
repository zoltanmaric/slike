var openpgp = window.openpgp; // use as CommonJS, AMD, ES6 module or via window.openpgp
openpgp.initWorker({ path:'node_modules/openpgp/dist/openpgp.worker.js' }); // set the relative web worker path

openpgp.config.aead_protect = true; // activate fast AES-GCM mode (not yet OpenPGP standard)


// Encrypt and decrypt Uint8Array data with a password

var options;

options = {
  data: 'pasteta',                          // input as Uint8Array (or String)
  passwords: ['secret stuff'],              // multiple passwords possible
  armor: false                              // don't ASCII armor (for Uint8Array output)
};

openpgp.encrypt(options).then(function(ciphertext) {
  var encrypted = ciphertext.message.packets.write(); // get raw encrypted packets as Uint8Array
  console.log('encrypted: ' + JSON.stringify(encrypted));
  return encrypted;
}).then(function(encrypted) {
  options = {
    message: openpgp.message.read(encrypted), // parse encrypted bytes
    password: 'secret stuff'                  // decrypt with password
    // format: 'binary'                          // output as Uint8Array
  };

  openpgp.decrypt(options).then(function(plaintext) {
    console.log('plaintext: ' + JSON.stringify(plaintext.data, null, 4));
    return plaintext.data; // Uint8Array([0x01, 0x01, 0x01])
  });

});





// File selection

// Check for the various File API support.
if (window.File && window.FileReader && window.FileList && window.Blob) {
  // Great success! All the File APIs are supported.
} else {
  alert('The File APIs are not fully supported in this browser.');
}

function handleFileSelect(evt) {
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
  }
  document.getElementById('list').innerHTML = '<ul>' + output.join('') + '</ul>';

  var reader = new FileReader();

  reader.onload = function(readerEvt) {
    var binaryString = readerEvt.target.result;
    var base64 = btoa(binaryString);
    document.getElementById("base64textarea").value = base64;
  };

  reader.readAsBinaryString(files[0]);
}

function handleDragOver(evt) {
  evt.stopPropagation();
  evt.preventDefault();
  evt.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
}

// Setup the dnd listeners.
var dropZone = document.getElementById('drop_zone');
dropZone.addEventListener('dragover', handleDragOver, false);
dropZone.addEventListener('drop', handleFileSelect, false);
