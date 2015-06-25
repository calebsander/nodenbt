var fs = require('fs');
var zlib = require('zlib');
var util = require('util');
var bn = require('./BigNumber.js');
var http = require('http');
var url = require('url');
var mime = require('./node_modules/fileserver/node_modules/mime');

var PORT = 8080; //port to host the server on

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

/*
	readnbt - the raw file data to be read
	nbtobject - a JavaScript object representing the data
	writenbt - raw file data to be written
	gzip - whether the file was compressed
	modified - whether the file has been modified since the read
*/
var readnbt, nbtobject, writenbt, gzip, modified;

//READ NBT - read a certain tag at a certain offset in the Buffer

function readEnd(offset) {
	return {
		value: null,
		length: 0
	};
}

function readByte(offset) {
	return {
		value: readnbt.readInt8(offset),
		length: 1
	};
}

function readShort(offset) {
	return {
		value: readnbt.readInt16BE(offset),
		length: 2
	};
}

function readInt(offset) {
	return {
		value: readnbt.readInt32BE(offset),
		length: 4
	};
}

function readLong(offset) {
	return {
		value: String(new bn(readInt(offset)).multiply(4294967296).add(readInt(offset + 4))), //JavaScript can't natively store 64-bit integers
		length: 8
	};
}

function readFloat(offset) {
	return {
		value: readnbt.readFloatBE(offset),
		length: 4
	};
}

function readDouble(offset) {
	return {
		value: readnbt.readDoubleBE(offset),
		length: 8
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
		value: Byte_Array,
		length: offset - originaloffset
	};
}

function readString(offset) {
	var originaloffset = offset;
	var bytesshort = readShort(offset); //read the length of the string
	offset += bytesshort.length;
	var resultString = readnbt.toString('utf8', offset, offset + bytesshort.value);
	offset += bytesshort.value;
	return {
		value: resultString,
		length: offset - originaloffset
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
		value: {
			type: typeInfo.readType,
			list: List
		},
		length: offset - originaloffset
	};
}

function readCompound(offset) {
	var originaloffset = offset;
	var readName, typeInfo, readValue;
	var Compound = {};

	var typebyte = readByte(offset);
	offset += typebyte.length;
	while (typebyte.value != TAG_End) { //keep reading until finding an End tag
		readName = readString(offset);
		offset += readName.length;
		typeInfo = extractType(typebyte);
		readValue = typeInfo.readFunction(offset);
		if (Compound[readName.value]) throw new Error('Tag ' + readName.value + ' already exists');
		else {
			Compound[readName.value] = {
				type: typeInfo.readType,
				value: readValue.value
			};
		}
		offset += readValue.length;

		typebyte = readByte(offset);
		offset += typebyte.length;
	}

	return {
		value: Compound,
		length: offset - originaloffset
	};
}

function readInt_Array(offset) {
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
		value: IntArray,
		length: offset - originaloffset
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
		readFunction: readFunction,
		readType: readType
	};
}

//WRITE NBT - write a certain tag to the end of the Buffer

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
	var bn = new BigNumber(value);
	var bnb = bn.divide(4294967296);
	if (bnb < -2147483648 || bnb > 2147483647) throw new Error('out of range: ' + value);
	writeInt(Number(bnb.intPart()));
	writeInt(Number(bn.mod(4294967296)));
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

function computeType(typeName) {
	var writeType, writeFunction;
	switch (typeName) {
		case null:
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
		writeType: writeType,
		writeFunction: writeFunction
	};
}

//HTTP SERVER

function return404(res) {
	res.setHeader('content-type', 'text/plain');
	res.statusCode = 404;
	res.end('404! No such page or method.');
}
var serv = require('./node_modules/fileserver/fileserver.js')('./files', true, return404);

String.prototype.begins = function(substring) {
	return this.substring(0, substring.length) == substring;
}

function walkPath(path) {
	var selected = nbtobject;
	for (var node = 1; node < path.length; node++) {
		switch (typeof path[node]) {
			case 'string':
				selected = selected.value[path[node]];
				break;
			case 'number':
				selected = selected.value.list[path[node]];
				break;
			default:
				throw new Error('Invalid path type');
		}
	}
	return selected;
}

http.createServer(function(req, res) {
	console.log(req.url);
	if (req.url == '/upload') {
		var data = new Buffer(0);
		req.on('data', function(chunk) {
			data = Buffer.concat([data, chunk]);
			if (data.length > 10000000) {
				res.setHeader('content-type', 'application/json');
				res.end(JSON.stringify({success: false, message: 'data overload'}));
				req.destroy();
			}
		}).on('end', function() {
			res.setHeader('content-type', 'application/json');
			zlib.gunzip(data, function(err, result) {
				if (err) {
					readnbt = Buffer.concat([data, new Buffer([TAG_End])]);
					try {
						nbtobject = readCompound(0).value[''];
						gzip = false;
						modified = false;
						res.end(JSON.stringify({success: true, gzip: false}));
					}
					catch (error) {
						console.log(error.stack);
						res.end(JSON.stringify({success: false, message: 'not dat or gzip'}));
					}
				}
				else {
					readnbt = Buffer.concat([result, new Buffer([TAG_End])]);
					try {
						nbtobject = readCompound(0).value[''];
						gzip = true;
						modified = false;
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
	else if (req.url == '/nbtjson') {
		res.setHeader('content-type', 'application/json');
		if (nbtobject) res.end(JSON.stringify({success: true, data: nbtobject}));
		else res.end(JSON.stringify({success: false, message: 'no data'}));
	}
	else if (req.url.begins('/editnbt/')) {
		var data = '';
		req.on('data', function(chunk) {
			data += chunk;
			if (data.length > 10000000) {
				res.setHeader('content-type', 'application/json');
				res.end(JSON.stringify({success: false, message: 'data overload'}));
				req.destroy();
			}
		}).on('end', function() {
			data = JSON.parse(data);
			try {
				switch (req.url) {
					case '/editnbt/up':
						var index = data.path.pop();
						var list = walkPath(data.path).value.list;
						console.log(list);
						var temp = list[index - 1];
						list[index - 1] = list[index];
						list[index] = temp;
				}
				modified = true;
				res.setHeader('content-type', 'application/json');
				res.end(JSON.stringify({success: true}));
			}
			catch (error) {
				res.setHeader('content-type', 'application/json');
				res.end(JSON.stringify({success: false, message: 'invalid instruction or path'}));
				throw error; //for development only
			}
		});
	}
	else if (req.url.begins('/download/')) {
		if (nbtobject) {
			if (gzip) {
				try {
					if (modified) {
						writenbt = new Buffer(0);
						writeCompound({'': nbtobject}, 0);
					}
					else writenbt = readnbt;
					zlib.gzip(writenbt, function(err, result) {
						res.setHeader('content-type', mime.lookup(req.url.substring(req.url.lastIndexOf('.') + 1)));
						res.end(result);
					});
				}
				catch (error) {
					console.log(error.stack);
					req.destroy(); //sending JSON will screw up the user, better to send nothing
				}
			}
			else {
				try {
					if (modified) {
						writenbt = new Buffer(0);
						writeCompound({'': nbtobject}, 0);
					}
					else writenbt = readnbt;
					res.setHeader('content-type', mime.lookup(req.url.substring(req.url.lastIndexOf('.') + 1)));
					res.end(writenbt);
				}
				catch (error) {
					console.log(error.stack);
					req.destroy(); //sending JSON will screw up the user, better to send nothing
				}
			}
		}
		else {
			res.setHeader('content-type', 'application/json');
			res.end(JSON.stringify({success: false, message: 'no data'}));
		}
	}
	else serv(res, req.url);
}).listen(PORT);
console.log('Server listening on port ' + String(PORT) + '\n');