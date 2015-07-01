//Import libraries
var fs = require('fs');
var zlib = require('zlib');
var util = require('util');
var strnum = require('./strint.js');
var http = require('http');
var url = require('url');
var mime = require('./node_modules/fileserver/node_modules/mime');

var PORT = Number(process.argv[2] || 8080); //port to host the server on

//NBT tag ID constants
var TAG_End = 0x00;
var TAG_Byte = 0x01;
var TAG_Short = 0x02;
var TAG_Int = 0x03;
var TAG_Long = 0x04;
var TAG_Float = 0x05;
var TAG_Double = 0x06;
var TAG_Byte_Array = 0x07;
var TAG_String = 0x08;
var TAG_List = 0x09;
var TAG_Compound = 0x0A;
var TAG_Int_Array = 0x0B;

var longuppershift = '4294967296'; //stores the value needed to multiply an integer to shift it left 32 bits - for long math

/*
	readnbt - the raw file data to be read
	nbtobject - a JavaScript object representing the data
	writenbt - raw file data to be written
	gzip - whether the file was compressed
*/
var readnbt, nbtobject, writenbt, gzip;

//READ NBT - read a certain tag at a certain offset in the Buffer
//each function returns the read value and its length so the offset can be changed accordingly

function readEnd(offset) {
	return {
		'value': null,
		'length': 0
	};
}

function readByte(offset) {
	return {
		'value': readnbt.readInt8(offset),
		'length': 1
	};
}

function readShort(offset) {
	return {
		'value': readnbt.readInt16BE(offset),
		'length': 2
	};
}

function readInt(offset) {
	return {
		'value': readnbt.readInt32BE(offset),
		'length': 4
	};
}

function readLong(offset) {
	var upperint = readInt(offset);
	offset += upperint.length;
	return {
		'value': String(strnum.add(strnum.mul(String(upperint.value), longuppershift), String(readnbt.readUInt32BE(offset)))), //JavaScript can't natively store 64-bit integers, so they are stored in a base-10 string representation
		'length': 8
	};
}

function readFloat(offset) {
	return {
		'value': readnbt.readFloatBE(offset),
		'length': 4
	};
}

function readDouble(offset) {
	return {
		'value': readnbt.readDoubleBE(offset),
		'length': 8
	};
}

function readByte_Array(offset) {
	var originaloffset = offset;
	var bytesint = readInt(offset); //read the length of the array
	offset += bytesint.length;

	var Byte_Array = [];
	var element;
	for (var i = 0; i < sizeint.value; i++) { //read each element and add it to the array
		element = readByte(offset);
		Byte_Array[i] = element.value;
		offset += element.length;
	}

	return {
		'value': Byte_Array,
		'length': offset - originaloffset
	};
}

function readString(offset) {
	var originaloffset = offset;
	var bytesshort = readShort(offset); //read the length of the string
	offset += bytesshort.length;
	var resultString = readnbt.toString('utf8', offset, offset + bytesshort.value);
	offset += bytesshort.value;
	return {
		'value': resultString,
		'length': offset - originaloffset
	};
}

function readList(offset) {
	var originaloffset = offset;
	var readFunction, readType;

	var typebyte = readByte(offset);
	offset += typebyte.length;
	var typeInfo = extractType(typebyte);

	var sizeint = readInt(offset); //read the length of the list
	offset += sizeint.length;

	var List = [];
	var element;
	for (var i = 0; i < sizeint.value; i++) { //reach each element and add it to the list
		element = typeInfo.readFunction(offset);
		List[i] = element.value;
		offset += element.length;
	}

	return {
		'value': {
			'type': typeInfo.readType,
			'list': List
		},
		'length': offset - originaloffset
	};
}

function readCompound(offset) {
	var originaloffset = offset;
	var readName, //name of the read tag
		typeInfo, //type name and read function
		readValue; //value read into the tag
	var Compound = {};

	var typebyte = readByte(offset); //read the first byte before the loop in case it is an End tag
	offset += typebyte.length;
	while (typebyte.value != TAG_End) { //keep reading until finding an End tag
		readName = readString(offset);
		offset += readName.length;
		typeInfo = extractType(typebyte);
		readValue = typeInfo.readFunction(offset);
		if (Compound[readName.value]) throw new Error('Tag ' + readName.value + ' already exists');
		else {
			Compound[readName.value] = {
				'type': typeInfo.readType,
				'value': readValue.value
			};
		}
		offset += readValue.length;

		typebyte = readByte(offset);
		offset += typebyte.length;
	}

	return {
		'value': Compound,
		'length': offset - originaloffset
	};
}

function readInt_Array(offset) { //see readByte_Array
	var originaloffset = offset;
	var sizeint = readInt(offset);
	offset += sizeint.length;

	var IntArray = [];
	var element;
	for (var i = 0; i < sizeint.value; i++) {
		element = readInt(offset);
		IntArray[i] = element.value;
		offset += element.length;
	}

	return {
		'value': IntArray,
		'length': offset - originaloffset
	};
}

//Select function to read tag and what its type is by the tag ID
function extractType(typebyte) {
	var readFunction, readType;
	switch (typebyte.value) { //choose which read function to use based on the type of element
		case TAG_End:
			readFunction = readEnd;
			readType = null;
			break;
		case TAG_Byte:
			readFunction = readByte;
			readType = 'TAG_Byte';
			break;
		case TAG_Short:
			readFunction = readShort;
			readType = 'TAG_Short';
			break;
		case TAG_Int:
			readFunction = readInt;
			readType = 'TAG_Int';
			break;
		case TAG_Long:
			readFunction = readLong;
			readType = 'TAG_Long';
			break;
		case TAG_Float:
			readFunction = readFloat;
			readType = 'TAG_Float';
			break;
		case TAG_Double:
			readFunction = readDouble;
			readType = 'TAG_Double';
			break;
		case TAG_Byte_Array:
			readFunction = readByte_Array;
			readType = 'TAG_Byte_Array';
			break;
		case TAG_String:
			readFunction = readString;
			readType = 'TAG_String';
			break;
		case TAG_List:
			readFunction = readList;
			readType = 'TAG_List';
			break;
		case TAG_Compound:
			readFunction = readCompound;
			readType = 'TAG_Compound';
			break;
		case TAG_Int_Array:
			readFunction = readInt_Array;
			readType = 'TAG_Int_Array';
			break;
		default:
			throw new Error('No such tag: ' + String(typebyte.value));
	}
	return {
		'readFunction': readFunction,
		'readType': readType
	};
}

//WRITE NBT - write a certain tag's payload to the end of the Buffer

function writeByte(value) {
	if (value < -128 || value > 127) throw new Error('out of range: ' + String(value));
	var bytebuffer = new Buffer(1);
	bytebuffer.writeInt8(value, 0);
	writenbt = Buffer.concat([writenbt, bytebuffer]);
}

function writeShort(value) {
	if (value < -32768 || value > 32767) throw new Error('out of range: ' + String(value));
	var shortbuffer = new Buffer(2);
	shortbuffer.writeInt16BE(value, 0);
	writenbt = Buffer.concat([writenbt, shortbuffer]);
}

function writeInt(value) {
	if (value < -2147483648 || value > 2147483647) throw new Error('out of range: ' + String(value));
	var intbuffer = new Buffer(4);
	intbuffer.writeInt32BE(value, 0);
	writenbt = Buffer.concat([writenbt, intbuffer]);
}

function writeLong(value) {
	if (strnum.gt(value, '9223372036854775807') || strnum.lt(value, '-9223372036854775808')) throw new Error('out of range: ' + value);
	var bnb = strnum.div(value, longuppershift, true); //get upper signed int
	var bnl = strnum.sub(value, strnum.mul(bnb, longuppershift)); //get lower unsigned int
	if (strnum.gt(bnl, '2147483647')) bnl = strnum.sub(bnl, longuppershift); //make lower int fit in a signed int
	writeInt(Number(bnb));
	writeInt(Number(bnl));
}

function writeFloat(value) {
	var floatbuffer = new Buffer(4);
	floatbuffer.writeFloatBE(value, 0);
	writenbt = Buffer.concat([writenbt, floatbuffer]);
}

function writeDouble(value) {
	var doublebuffer = new Buffer(8);
	doublebuffer.writeDoubleBE(value, 0);
	writenbt = Buffer.concat([writenbt, doublebuffer]);
}

function writeByte_Array(value) {
	writeInt(value.length);
	for (var i = 0; i < value.length; i++) writeByte(value[i]);
}

function writeString(value) {
	writeShort(value.length);
	var stringbuffer = new Buffer(value.length);
	stringbuffer.write(value, 0);
	writenbt = Buffer.concat([writenbt, stringbuffer]);
}

function writeList(value) {
	var typeInfo = computeType(value.type);
	writeByte(typeInfo.writeType);
	writeInt(value.list.length);
	for (var i = 0; i < value.list.length; i++) typeInfo.writeFunction(value.list[i]);
}

function writeCompound(value) {
	var typeInfo;
	for (var i in value) {
		typeInfo = computeType(value[i].type);
		writeByte(typeInfo.writeType);
		writeString(i);
		typeInfo.writeFunction(value[i].value);
	}
	writeByte(TAG_End);
}

function writeInt_Array(value) {
	writeInt(value.length);
	for (var i = 0; i < value.length; i++) writeInt(value[i]);
}

function computeType(typeName) { //sort of the opposite to extractType; returns the TAG id and the function necessary to write the tag
	var writeType, writeFunction;
	switch (typeName) {
		case null: //should never be written
			writeType = TAG_End;
			break;
		case 'TAG_Byte':
			writeFunction = writeByte;
			writeType = TAG_Byte;
			break;
		case 'TAG_Short':
			writeFunction = writeShort;
			writeType = TAG_Short;
			break;
		case 'TAG_Int':
			writeFunction = writeInt;
			writeType = TAG_Int;
			break;
		case 'TAG_Long':
			writeFunction = writeLong;
			writeType = TAG_Long;
			break;
		case 'TAG_Float':
			writeFunction = writeFloat;
			writeType = TAG_Float;
			break;
		case 'TAG_Double':
			writeFunction = writeDouble;
			writeType = TAG_Double;
			break;
		case 'TAG_Byte_Array':
			writeFunction = writeByte_Array;
			writeType = TAG_Byte_Array;
			break;
		case 'TAG_String':
			writeFunction = writeString;
			writeType = TAG_String;
			break;
		case 'TAG_List':
			writeFunction = writeList;
			writeType = TAG_List;
			break;
		case 'TAG_Compound':
			writeFunction = writeCompound;
			writeType = TAG_Compound;
			break;
		case 'TAG_Int_Array':
			writeFunction = writeInt_Array;
			writeType = TAG_Int_Array;
			break;
		default:
			throw new Error('No such tag: ' + value.type);
	}

	return {
		'writeType': writeType,
		'writeFunction': writeFunction
	};
}

//HTTP SERVER

function return404(res) { //should never end up getting called in normal use
	res.setHeader('content-type', 'text/plain');
	res.statusCode = 404;
	res.end('404! No such page or method.');
}
var serv = require('./node_modules/fileserver/fileserver.js')('./files', true, return404);

String.prototype.begins = function(substring) { //used to check if request URLs fall in a certain class
	return this.substring(0, substring.length) == substring;
}

//Like getPath in script.js except does the opposite thing; path array -> reference to tag
//Note that it returns the object with 'value' and 'type' as keys
function walkPath(path) {
	var selected = nbtobject;
	for (var node = 0; node < path.length; node++) { //iterate over each step
		switch (selected.type) {
			case 'TAG_List':
				selected = selected.value.list[path[node]];
				break;
			default: //TAG_Compound, TAG_Byte_Array, TAG_Int_Array
				selected = selected.value[path[node]];
		}
		if (!selected) throw new Error('Not a valid path: ' + String(path[node])); //catch errors more elegantly than by letting undefined go through
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

function addEndTag(buffer) { //adds a TAG_End to the end of a read buffer
	return Buffer.concat([buffer, new Buffer([TAG_End])]);
}

http.createServer(function(req, res) {
	console.log(req.url); //for debugging purposes
	if (req.url == '/upload') { //uploading the raw file
		var data = new Buffer(0);
		req.on('data', function(chunk) { //build the buffer of file contents
			data = Buffer.concat([data, chunk]);
			checkUploadSize(data, req, res);
		}).on('end', function() {
			res.setHeader('content-type', 'application/json');
			zlib.gunzip(data, function(err, result) { //try to unzip the file
				if (err) { //not a compressed file
					readnbt = addEndTag(data);
					try {
						nbtobject = readCompound(0).value['']; //get past the empty base compound
						gzip = false;
						res.end(JSON.stringify({success: true, gzip: false}));
					}
					catch (error) { //would be disastrous to quit the program when a bad file is uploaded
						console.log(error.stack);
						res.end(JSON.stringify({success: false, message: 'not dat or gzip'}));
					}
				}
				else {
					readnbt = addEndTag(result);
					try {
						nbtobject = readCompound(0).value[''];
						gzip = true;
						res.end(JSON.stringify({success: true, gzip: true}));
					}
					catch (error) {
						console.log(error.stack);
						res.end(JSON.stringify({success: false, message: 'parse failed'}));
					}
				}
			});
		});
	}
	else if (req.url == '/nbtjson') { //getting the JSON representation of the file
		res.setHeader('content-type', 'application/json');
		if (nbtobject) res.end(JSON.stringify({success: true, data: nbtobject}));
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
						var tag = walkPath(data.path);
						tag.value = data.value;
						break;
					case '/editnbt/rename':
						var tag = data.path.pop(); //see code for up
						var compound = walkPath(data.path).value;
						compound[data.name] = compound[tag]; //switch tags
						delete compound[tag]; //remove old tag
						break;
					case '/editnbt/delete':
						var tag = data.path.pop(); //see code for up
						delete walkPath(data.path).value[tag]; //remove the tag
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
		if (nbtobject) {
			try {
				writenbt = new Buffer(0);
				writeCompound({'': nbtobject}); //include the empty base tag again
				if (gzip) {
					zlib.gzip(writenbt, function(err, result) {
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
					res.end(writenbt);
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
	else serv(res, req.url); //be a file server otherwise
}).listen(PORT);
console.log('Server listening on port ' + String(PORT) + '\n');