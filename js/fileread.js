var gzip; //whether the file is gzipped
var type; //the file extension of the upload, for rendering purposes
var modified = false; //whether the file has been editted
var nbtObject; //JavaScript object representing read NBT data
var mcaObject; //JavaScript object containing read MCA buffer (chunks may be either stored as buffers or nbt objects)
var fileName; //the name of the uploaded file

const DAT = 0, MCA = 1;
function reportError(message, error) {
	$('div#loading').text(message).addClass('error');
	type = nbtObject = mcaObject = undefined;
	console.warn(error);
}
function fileDragHover(e) { //triggered when dragging a file onto or off the filedrag div
	e.stopPropagation();
	e.preventDefault();
	if (e.type == 'dragover') $('div#filedrag').addClass('hover').text('Drop file here'); //if dragged onto
	else $('div#filedrag').removeClass('hover').text('Upload'); //if dragged off
}
function fileSelectHandler(e) { //triggered when drogging a file onto the filedrag div
	fileDragHover(e);
	if (e.originalEvent.dataTransfer && e.originalEvent.dataTransfer.files) var files = e.originalEvent.dataTransfer.files;
	else return;
	var reader;
	reader = new FileReader();
	reader.name = files[0].name;
	reader.type = files[0].type;
	reader.onload = function(e) { //when file has been processed into memory, upload it to the server and display it
		if (!modified || confirm('You have unsaved changes; are you sure you want to reupload?')) {
			modified = false;
			$('div#nbt').children().remove();
			remakeImages();
			$('div#nbt').prepend($('<div>').attr('id', 'loading').text('Parsing...'));
			$('li#open').removeClass('open');
			setTimeout(function() {
				const readArray = e.target.result; //the ArrayBuffer containing the data read from the file
				fileName = e.target.name;
				if (fileName.endsWith('mca') || fileName.endsWith('mcr')) {
					type = MCA;
					try {
						const read = new MCARead(new Buffer(readArray));
						const readResult = read.getAllChunks();
						try {
							$('div#nbt').append($('<div>').attr('id', 'filetitle').text(fileName));
							$('div#nbt').append(renderMCA(readResult).addClass('shown'));
							if (gzip) $('div#filetitle').text($('div#filetitle').text() + ' (compressed)');
							$('div#loading').remove();
							$('a#search').addClass('shown');
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
				else if (fileName.endsWith('dat')) {
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
						$('div#loading').text('Rendering...');
						setTimeout(function() { //makes sure the previous jQuery commands complete before hanging the client while processing
							try {
								$('div#nbt').append($('<div>').attr('id', 'filetitle').text(fileName));
								$('div#nbt').append($('<ul>').append(renderJSON(readResult, undefined, true).addClass('shown'))); //display the JSON
								$('div#nbt>ul>li>ul').show();
								if (gzip) $('div#filetitle').text($('div#filetitle').text() + ' (compressed)');
								$('div#loading').remove();
								$('a#search').addClass('shown');
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
				else reportError('NOT A VALID FILE TYPE', e);
			}, 100);
		}
	};
	reader.readAsArrayBuffer(files[0]); //read the file
}