//Import libraries
const fs = require('fs');
const http = require('http');
const url = require('url');
const zlib = require('zlib');
const mime = require('./node_modules/fileserver/node_modules/mime');
const mca = require('./mca.js');
const nbt = require('./nbt.js');

const PORT = Number(process.argv[2] || 8080); //port to host the server on

var readNBT, //an instance of nbt.Read wrapping the target NBT data
	nbtObject, //a JavaScript object representing the data
	writeNBT, //an instance of nbt.Write wrapping nbtObject
	gzip, //whether the file was compressed
	type, //the file extension of the uploaded file
	fullData; //the entire read mca object with Buffer data

//HTTP SERVER

function return404(res) { //should never end up getting called in normal use
	res.setHeader('content-type', 'text/plain');
	res.statusCode = 404;
	res.end('404! No such page or method.');
}
const serv = require('./node_modules/fileserver/fileserver.js')('./serv-files', true, return404);

String.prototype.begins = function(substring) { //used to check if request URLs fall in a certain class
	return this.substring(0, substring.length) == substring;
}

function subtype(type) { //gets the type of the inner element of an array
	switch (type) {
		case 'TAG_Byte_Array':
			return 'TAG_Byte';
		case 'TAG_Int_Array':
			return 'TAG_Int';
	}
}
//Like getPath in script.js except does the opposite thing; path array -> reference to tag
//Note that it returns the object with 'value' and 'type' as keys
function walkPath(path) {
	switch (type) {
		case 'dat': //NBT
			var selected = nbtObject;
			break;
		default: //MCA
			var selected = fullData[path[0]][path[1]];
			path.splice(0, 2);
	}
	for (var node = 0; node < path.length; node++) { //iterate over each step
		switch (selected.type) {
			case 'TAG_List':
				selected = {
					'type': selected.value.type,
					'value': selected.value.list[path[node]]
				};
				break;
			case 'TAG_Compound':
				selected = selected.value[path[node]];
				break;
			default: //TAG_Byte_Array or TAG_Int_Array
				selected = {
					'type': subtype(selected.type),
					'value': selected.value[path[node]]
				};
		}
		if (selected === undefined) throw new Error('Not a valid path: ' + String(path[node])); //catch errors more elegantly than by letting undefined go through
	}
	return selected;
}

var maxUploadLength = 1e7; //to avoid running out of memory, don't allow more than 10MB to be uploaded at once
function checkUploadSize(data, req, res) { //if data overload, respond that too much data was uploaded and destroy the request
	if (data.length > maxUploadLength) {
		res.setHeader('content-type', 'application/json');
		res.end(JSON.stringify({success: false, message: 'data overload'}));
		req.destroy();
	}
}

function openNBT(data, res) {
	zlib.gunzip(data, function(err, result) { //try to unzip the file
		if (err) { //not a compressed file
			readNBT = new nbt.Read(data);
			try {
				nbtObject = readNBT.readComplete();
				gzip = false;
				res.end(JSON.stringify({success: true, gzip: false}));
			}
			catch (error) { //would be disastrous to quit the program when a bad file is uploaded
				console.log(error.stack);
				res.end(JSON.stringify({success: false, message: 'not dat or gzip'}));
			}
		}
		else {
			readNBT = new nbt.Read(result);
			try {
				nbtObject = readNBT.readComplete();
				gzip = true;
				res.end(JSON.stringify({success: true, gzip: true}));
			}
			catch (error) {
				console.log(error.stack);
				res.end(JSON.stringify({success: false, message: 'parse failed'}));
			}
		}
	});
}
function openMCA(data, res) {
	try {
		readNBT = new mca.Read(data);
		fullData = readNBT.getAllChunks();
		var x, z;
		nbtObject = [];
		for (x in fullData) {
			nbtObject[x] = [];
			for (z in fullData[x]) nbtObject[x][z] = true;
		}
		res.end(JSON.stringify({success: true}));
	}
	catch (error) {
		console.log(error.stack);
		res.end(JSON.stringify({success: false, message: 'parse failed'}));
	}
}
function getProcessedNBT(x, z) {
	if (fullData[x][z] instanceof Buffer) fullData[x][z] = new nbt.Read(fullData[x][z]).readComplete();
	return fullData[x][z];
}

http.createServer(function(req, res) {
	console.log(req.url); //for debugging purposes
	if (req.url.begins('/upload')) { //uploading the raw file
		type = url.parse(req.url, true).query.type;
		var data = new Buffer(0);
		req.on('data', function(chunk) { //build the buffer of file contents
			data = Buffer.concat([data, chunk]);
			checkUploadSize(data, req, res);
		}).on('end', function() {
			res.setHeader('content-type', 'application/json');
			if (type == 'dat') openNBT(data, res);
			else if (type == 'mca' || type == 'mcr') openMCA(data, res);
			else res.end(JSON.stringify({success: false, message: 'invalid file type'}));
		});
	}
	else if (req.url == '/nbtjson') { //getting the JSON representation of the file
		res.setHeader('content-type', 'application/json');
		if (nbtObject) res.end(JSON.stringify({success: true, data: nbtObject, type: type}));
		else res.end(JSON.stringify({success: false, message: 'no data'}));
	}
	else if (req.url.begins('/editnbt/')) { //editting the NBT
		var data = '';
		req.on('data', function(chunk) {
			data += chunk;
			checkUploadSize(data, req, res);
		}).on('end', function() {
			data = JSON.parse(data);
			try {
				switch (req.url) { //depending on what editting function is being used
					case '/editnbt/up':
						var index = data.path.pop(); //get path excluding the position in the array to be moved
						var list = walkPath(data.path).value; //for TAG_Byte_Array or TAG_Int_Array
						if (!Array.isArray(list)) list = list.list; //for TAG_List
						var temp = list[index - 1]; //store the value at the index that will be overwritten
						list[index - 1] = list[index]; //move element up
						list[index] = temp; //move previous element down
						break;
					case '/editnbt/down': //see code for up
						var index = data.path.pop();
						var list = walkPath(data.path).value;
						if (!Array.isArray(list)) list = list.list;
						var temp = list[index + 1];
						list[index + 1] = list[index];
						list[index] = temp;
						break;
					case '/editnbt/edit':
						var tag = data.path.pop(); //see code for up
						var parent = walkPath(data.path);
						switch (parent.type) { //save the new value (different types of parents require different fashions of locating the child)
							case 'TAG_List':
								parent.value.list[tag] = data.value;
								break;
							case 'TAG_Compound':
								parent.value[tag].value = data.value;
								break;
							default: //TAG_Byte_Array or TAG_Int_Array
								parent.value[tag] = data.value;
						}
						break;
					case '/editnbt/rename':
						var tag = data.path.pop(); //see code for up
						var compound = walkPath(data.path).value;
						compound[data.name] = compound[tag]; //switch tags
						delete compound[tag]; //remove old tag
						break;
					case '/editnbt/delete':
						var tag = data.path.pop(); //see code for up
						var parent = walkPath(data.path);
						switch (parent.type) { //remove the tag (different types of parents require different fashions of locating the child)
							case 'TAG_List':
								parent.value.list.splice(tag, 1);
								break;
							case 'TAG_Compound':
								delete parent.value[tag];
								break;
							default: //TAG_Byte_Array or TAG_Int_Array
								parent.value.splice(tag, 1);
						}
						break;
					case '/editnbt/coerce':
						var tag = walkPath(data.path); //get the tag being editted
						if (tag.type == 'TAG_List') {
							if (tag.value.type == 'TAG_String' && data.type != 'TAG_Long') {
								for (var element = 0; element < tag.value.list.length; element++) tag.value.list[element] = Number(tag.value.list[element]); //convert strings to numbers
							}
							else if (data.type == 'TAG_String') {
								for (var element = 0; element < tag.value.list.length; element++) tag.value.list[element] = String(tag.value.list[element]); //convert numbers to strings
							}
							tag.value.type = data.type;
						}
						else {
							if (tag.type == 'TAG_String' && data.type != 'TAG_Long') tag.value = Number(tag.value); //convert strings to numbers
							else if (data.type == 'TAG_String') tag.value = String(tag.value); //convert numbers to strings
							tag.type = data.type;
						}
						break;
					case '/editnbt/add':
						var parent = walkPath(data.path); //get tag being added to
						switch (parent.type) {
							case 'TAG_List':
								parent.value.list.push(data.value);
								break;
							case 'TAG_Compound':
								parent.value[data.key] = {
									'type': data.type,
									'value': data.value
								};
								break;
							default: //TAG_Byte_Array or TAG_Int_Array
								parent.value.push(data.value);
						}
				}
				res.setHeader('content-type', 'application/json');
				res.end(JSON.stringify({success: true}));
			}
			catch (error) { //catch-all for something having gone wrong with editting
				console.log(error.stack);
				res.setHeader('content-type', 'application/json');
				res.end(JSON.stringify({success: false, message: 'invalid instruction or path'}));
			}
		});
	}
	else if (req.url.begins('/download/')) { //downloading the new NBT file
		if (nbtObject) {
			try {
				switch (type) {
					case 'dat': //nbt
						writeNBT = new nbt.Write();
						writeNBT.writeComplete(nbtObject); //include the empty base tag again
						if (gzip) {
							zlib.gzip(writeNBT.getBuffer(), function(err, result) {
								if (err) {
									console.log(err.stack);
									req.destroy(); //sending JSON will screw up the user, better to send nothing
								}
								else {
									res.setHeader('content-type', mime.lookup(req.url.substring(req.url.lastIndexOf('.') + 1)));
									res.end(result);
								}
							});
						}
						else {
							res.setHeader('content-type', mime.lookup(req.url.substring(req.url.lastIndexOf('.') + 1)));
							res.end(writeNBT.getBuffer());
						}
						break;
					default: //mca
						var chunks = [];
						var tempWrite; //temporary nbt.Write instance
						var x, z;
						for (x in fullData) {
							if (chunks[x] === undefined) chunks[x] = [];
							for (z in fullData[x]) {
								if (fullData[x][z] instanceof Buffer) chunks[x][z] = fullData[x][z];
								else {
									tempWrite = new nbt.Write();
									tempWrite.writeComplete(fullData[x][z]);
									chunks[x][z] = tempWrite.getBuffer();
								}
							}
						}
						res.setHeader('content-type', mime.lookup(req.url.substring(req.url.lastIndexOf('.') + 1)));
						writeNBT = new mca.Write();
						writeNBT.setAllChunks(chunks);
						res.end(writeNBT.getBuffer());
				}
			}
			catch (error) {
				console.log(error.stack);
				req.destroy(); //sending JSON will screw up the user, better to send nothing
			}
		}
		else {
			res.setHeader('content-type', 'application/json');
			res.end(JSON.stringify({success: false, message: 'no data'}));
		}
	}
	else if (req.url.begins('/chunk/')) {
		try {
			var selectedChunk = req.url.split('/');
			var x = selectedChunk[2], z = selectedChunk[3];
			res.setHeader('content-type', 'application/json');
			res.end(JSON.stringify({success: true, data: getProcessedNBT(x, z)}));
		}
		catch (error) {
			console.log(error.stack);
			res.setHeader('content-type', 'application/json');
			res.end(JSON.stringify({success: false, message: 'invalid request'}));
		}
	}
	else serv(res, req.url); //be a file server otherwise
}).listen(PORT);
console.log('Server listening on port ' + String(PORT) + '\n');