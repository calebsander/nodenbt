var gzip; //whether the file is gzipped
var type; //the file extension of the upload, for rendering purposes
var modified = false; //whether the file has been editted

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
		$('div#nbt').children().remove();
		remakeImages();
		$('div#nbt').prepend($('<div>').attr('id', 'loading').text('Parsing...'));
		$('li#open').removeClass('open');
		setTimeout(function() {
			const read = new NBTRead(new Buffer(e.target.result));
			const readResult = read.readComplete();
			gzip = false; //gzip = response.gzip;
			type = 'dat';
			/*if (!response.success) { //don't try to display an unparseable file
				if (response.message == 'invalid file type') $('div#loading').text('NOT A VALID FILE TYPE');
				else $('div#loading').text('COULD NOT PARSE');
				$('div#loading').addClass('error');
			}
			else {
				if (!response.success) $('div#loading').text('ERROR').addClass('error'); //something somewhere went wrong
				else {*/
					closeAll();
					$('div#loading').text('Rendering...');
					setTimeout(function() { //makes sure the previous jQuery commands complete before hanging the client while processing
						$('div#nbt').append($('<div>').attr('id', 'filetitle').text(e.target.name));
						if (type == 'dat') {
							$('div#nbt').append($('<ul>').append(renderJSON(readResult, undefined, true).addClass('shown'))); //display the JSON
							$('div#nbt>ul>li>ul').show();
						}
						else $('div#nbt').append(renderMCA(readResult).addClass('shown'));
						if (gzip) $('div#filetitle').text($('div#filetitle').text() + ' (compressed)');
						$('div#loading').remove();
						$('a#search').addClass('shown');
					}, 100);
				//}
			//}
		}, 100);
	};
	reader.readAsArrayBuffer(files[0]); //read the file
}