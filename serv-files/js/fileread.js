var gzip; //whether the file is gzipped
var type; //the file extension of the upload, for rendering purposes
var modified = false; //whether the file has been editted

$.ajaxTransport('+*', function(options, originalOptions, jqXHR) { //allows client to upload the raw binary contents of the NBT file instead of a string
	if (window.FormData && (options.data && ((window.Blob && options.data instanceof Blob) || (window.ArrayBuffer && options.data instanceof ArrayBuffer)))) {
		return {
			send: function(headers, completeCallback) {
				var xhr = new XMLHttpRequest(),
					url = options.url || window.location.href,
					type = options.type || 'GET',
					dataType = options.dataType || 'text',
					data = options.data || null,
					async = options.async || true;

				xhr.addEventListener('load', function() {
					var res = {};
					res[dataType] = xhr.response;
					completeCallback(xhr.status, xhr.statusText, res, xhr.getAllResponseHeaders());
				});

				xhr.open(type, url, async);
				xhr.responseType = dataType;
				if (data) data = new Uint8Array(data);
				xhr.send(data);
			},
			abort: function() {
				jqXHR.abort();
			}
		};
	}
});

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
		$.ajax({
			url: '/upload?type=' + (type = e.target.name.substring(e.target.name.lastIndexOf('.') + 1)),
			type: 'POST',
			dataType: 'json',
			data: e.target.result,
			processData: false, //so jQuery doesn't coerce it into a string first
			success: (function() {
				return function(response) {
					gzip = response.gzip;
					$('li#open').removeClass('open');
					if (!response.success) { //don't try to display an unparseable file
						if (response.message == 'invalid file type') $('div#loading').text('NOT A VALID FILE TYPE');
						else $('div#loading').text('COULD NOT PARSE');
						$('div#loading').addClass('error');
					}
					else {
						$.ajax({ //fetch the JSON version
							url: '/nbtjson',
							dataType: 'json',
							success: (function() {
								return function(response) {
									if (!response.success) $('div#loading').text('ERROR').addClass('error'); //something somewhere went wrong
									else {
										$('a#download').attr('download', e.target.name).attr('href', '/download/' + e.target.name); //download the file with the same name and same compression
										closeAll();
										$('div#loading').text('Rendering...');
										setTimeout(function() { //makes sure the previous jQuery commands complete before hanging the client while processing
											$('div#nbt').append($('<div>').attr('id', 'filetitle').text(e.target.name));
											if (type == 'dat') {
												$('div#nbt').append($('<ul>').append(renderJSON(response.data, undefined, true).addClass('shown'))); //display the JSON
												$('div#nbt>ul>li>ul').show();
											}
											else $('div#nbt').append(renderMCA(response.data).addClass('shown'));
											if (gzip) $('div#filetitle').text($('div#filetitle').text() + ' (compressed)');
											$('div#loading').remove();
										}, 100);
									}
								}
							}())
						});
					}
				}
			}())
		});
	};
	reader.readAsArrayBuffer(files[0]); //read the file
}