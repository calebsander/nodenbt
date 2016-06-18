var gzip; //whether the file is gzipped
var type; //the file extension of the upload, for rendering purposes
var modified = false; //whether the file has been editted
var nbtObject; //JavaScript object representing read NBT data
var mcaObject; //JavaScript object containing read MCA buffer (chunks may be either stored as buffers or nbt objects)
var fileName; //the name of the uploaded file
var loadingDiv = $('<div>').attr('id', 'loading'); //the div that contains loading text and error text

const DAT = 0, MCA = 1;
function reportError(message, error) {
	loadingDiv.text(message).addClass('error');
	type = nbtObject = mcaObject = undefined;
	if (error !== undefined) console.warn(error);
}
function fileDragHover(e) { //triggered when dragging a file onto or off the filedrag div
	e.stopPropagation();
	e.preventDefault();
	if (e.type == 'dragover') fileDrag.addClass('hover').text('Drop file here'); //if dragged onto
	else fileDrag.removeClass('hover').text('Upload'); //if dragged off
}
function fileSelectHandler(e) { //triggered when drogging a file onto the filedrag div
	fileDragHover(e);
	if (e.originalEvent.dataTransfer && e.originalEvent.dataTransfer.files) var files = e.originalEvent.dataTransfer.files;
	else return;
	loadFile(files);
}
function loadFile(files) {
	var reader;
	reader = new FileReader();
	reader.name = files[0].name;
	reader.type = files[0].type;
	reader.onload = function(e) { //when file has been processed into memory, upload it to the server and display it
		if (!modified || confirm('You have unsaved changes; are you sure you want to reupload?')) {
			modified = false;
			nbtDiv.children().remove();
			remakeImages();
			nbtDiv.prepend(loadingDiv.removeClass('error').text('Parsing...'));
			setTimeout(function() {
				const readArray = e.target.result; //the ArrayBuffer containing the data read from the file
				fileName = e.target.name;
				var fileTitle = $('<div>').attr('id', 'filetitle').text(fileName);
				if (fileName.endsWith('.mca') || fileName.endsWith('.mcr')) {
					type = MCA;
					try {
						const read = new MCARead(new Buffer(readArray));
						const readResult = read.getAllChunks();
						try {
							nbtDiv.append(fileTitle);
							nbtDiv.append(renderMCA(readResult).addClass('shown'));
							if (gzip) fileTitle.text(fileTitle.text() + ' (compressed)');
							loadingDiv.remove();
							searchDiv.addClass('shown');
							mcaObject = readResult;
						}
						catch (e) {
							reportError('COULD NOT RENDER', e);
						}
					}
					catch (e) {
						reportError('COULD NOT PARSE', e);
					}
				}
				else if (fileName.endsWith('.dat') || fileName.endsWith('.dat_mcr') || fileName.endsWith('.dat_old') || fileName.endsWith('.nbt')) {
					type = DAT;
					var uncompressed;
					try {
						uncompressed = jz.gz.decompress(readArray).buffer;
						gzip = true;
					}
					catch (e) {
						uncompressed = readArray;
						gzip = false;
					}
					try {
						const read = new NBTRead(new Buffer(uncompressed));
						const readResult = read.readComplete();
						closeAll();
						loadingDiv.text('Rendering...');
						setTimeout(function() { //makes sure the previous jQuery commands complete before hanging the client while processing
							try {
								nbtDiv.append(fileTitle);
								nbtDiv.append($('<ul>').append(renderJSON(readResult, undefined, true).addClass('shown'))); //display the JSON
								$('div#nbt>ul>li>ul').show();
								if (gzip) fileTitle.text(fileTitle.text() + ' (compressed)');
								loadingDiv.remove();
								searchDiv.addClass('shown');
								nbtObject = readResult;
							}
							catch (e) {
								reportError('COULD NOT RENDER', e);
							}
						}, 100);
					}
					catch (e) {
						reportError('COULD NOT PARSE', e);
					}
				}
				else reportError('NOT A VALID FILE TYPE');
			}, 100);
		}
	};
	reader.readAsArrayBuffer(files[0]); //read the file
}