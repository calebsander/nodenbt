var fs = require('fs');
var zlib = require('zlib');
var util = require('util');
var bn = require('./BigNumber.js');
var http = require('http');
var mime = require('mime');
var url = require('url');

var PORT = 8080;

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
var readnbt, nbtobject, writenbt, gzip, modified;

//READ NBT

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
		value: String(new bn(readInt(offset)).multiply(4294967296).add(readInt(offset + 4))),
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
	var bytesint = readInt(offset);
	offset += bytesint.length;
	
	var Byte_Array = [];
	var element;
	for (var i = 0; i < sizeint.value; i++) {
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
	var bytesshort = readShort(offset);
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
	switch (typebyte.value) {
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
	
	var sizeint = readInt(offset);
	offset += sizeint.length;
	
	var List = [];
	var element;
	for (var i = 0; i < sizeint.value; i++) {
		element = readFunction(offset);
		List[i] = element.value;
		offset += element.length;
	}
	
	return {
		value: {
			type: readType,
			list: List
		},
		length: offset - originaloffset
	};
}

function readCompound(offset) {
	var originaloffset = offset;
	var readType, readName, readValue;
	var Compound = {};
	
	var typebyte = readByte(offset);
	offset += typebyte.length;
	while (typebyte.value != TAG_End) {
		readName = readString(offset);
		offset += readName.length;
		
		switch (typebyte.value) {
			case TAG_Byte:
				readValue = readByte(offset);
				readType = 'TAG_Byte';
				break;
			case TAG_Short:
				readValue = readShort(offset);
				readType = 'TAG_Short';
				break;
			case TAG_Int:
				readValue = readInt(offset);
				readType = 'TAG_Int';
				break;
			case TAG_Long:
				readValue = readLong(offset);
				readType = 'TAG_Long';
				break;
			case TAG_Float:
				readValue = readFloat(offset);
				readType = 'TAG_Float';
				break;
			case TAG_Double:
				readValue = readDouble(offset);
				readType = 'TAG_Double';
				break;
			case TAG_Byte_Array:
				readValue = readByte_Array(offset);
				readType = 'TAG_Byte_Array';
				break;
			case TAG_String:
				readValue = readString(offset);
				readType = 'TAG_String';
				break;
			case TAG_List:
				readValue = readList(offset);
				readType = 'TAG_List';
				break;
			case TAG_Compound:
				readValue = readCompound(offset);
				readType = 'TAG_Compound';
				break;
			case TAG_Int_Array:
				readValue = readInt_Array(offset);
				readType = 'TAG_Int_Array';
				break;
			default:
				throw new Error('No such tag: ' + String(typebyte.value));
		}
		if (Compound[readName.value]) throw new Error('Tag ' + readName.value + ' already exists');
		else {
			Compound[readName.value] = {
				type: readType,
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

//WRITE NBT

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
	var writeFunction, writeType;
	switch (value.type) {
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
	writeByte(writeType);
	
	writeInt(value.list.length);
	for (var i = 0; i < value.list.length; i++) writeFunction(value.list[i]);
}

function writeCompound(value) {
	for (var i in value) {
		switch (value[i].type) {
			case 'TAG_Byte':
				writeByte(TAG_Byte);
				writeString(i);
				writeByte(value[i].value);
				break;
			case 'TAG_Short':
				writeByte(TAG_Short);
				writeString(i);
				writeShort(value[i].value);
				break;
			case 'TAG_Int':
				writeByte(TAG_Int);
				writeString(i);
				writeInt(value[i].value);
				break;
			case 'TAG_Long':
				writeByte(TAG_Long);
				writeString(i);
				writeLong(value[i].value);
				break;
			case 'TAG_Float':
				writeByte(TAG_Float);
				writeString(i);
				writeFloat(value[i].value);
				break;
			case 'TAG_Double':
				writeByte(TAG_Double);
				writeString(i);
				writeDouble(value[i].value);
				break;
			case 'TAG_Byte_Array':
				writeByte(TAG_Byte_Array);
				writeString(i);
				writeByte_Array(value[i].value);
				break;
			case 'TAG_String':
				writeByte(TAG_String);
				writeString(i);
				writeString(value[i].value);
				break;
			case 'TAG_List':
				writeByte(TAG_List);
				writeString(i);
				writeList(value[i].value);
				break;
			case 'TAG_Compound':
				writeByte(TAG_Compound);
				writeString(i);
				writeCompound(value[i].value);
				break;
			case 'TAG_Int_Array':
				writeByte(TAG_Int_Array);
				writeString(i);
				writeInt_Array(value[i].value);
				break;
			default:
				throw new Error('No such tag: ' + value[i].type);
		}
	}
	
	writeByte(TAG_End);
}

function writeInt_Array(value) {
	writeInt(value.length);
	for (var i = 0; i < value.length; i++) writeInt(value[i]);
}

//HTTP SERVER

function return404(res) {
	res.setHeader('content-type', 'text/plain');
	res.end('404! No such page or method.');
}

http.createServer(function(req, res) {
	console.log(req.url);
	if (req.url == '/nbtjson') {
		res.setHeader('content-type', 'application/json');
		if (nbtobject) res.end(JSON.stringify({success: true, data: nbtobject}));
		else res.end(JSON.stringify({success: false, message: 'no data'}));
	}
	else if (req.url.substr(0, 7) == '/setnbt') {
		var data = '';
		if (nbtobject) {
			req.on('data', function(chunk) {
				data += chunk;
				if (data.length > 1000000) {
					res.setHeader('content-type', 'application/json');
					res.end(JSON.stringify({success: false, message: 'data overload'}));
					req.destroy();
				}
			}).on('end', function() {
				nbtobject = JSON.parse(data);
				res.setHeader('content-type', 'application/json');
				modified = true;
				res.end(JSON.stringify({success: true}));
			});
		}
		else {
			res.setHeader('content-type', 'application/json');
			res.end(JSON.stringify({success: false, message: 'no data'}));
		}
	}
	else if (req.url == '/upload') {
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
	else if (req.url.substring(0, 10) == '/download/') {
		if (nbtobject) {
			if (gzip) {
				try {
					if (modified) {
						writenbt = new Buffer(0);
						writeCompound({'': nbtobject}, 0);
					}
					else writenbt = readnbt;
					zlib.gzip(writenbt, function(err, result) {
						res.setHeader('content-type', mime.lookup(req.url.substring(req.url.lastIndexOf('.') + 1, req.url.length)));
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
					res.setHeader('content-type', mime.lookup(req.url.substring(req.url.lastIndexOf('.') + 1, req.url.length)));
					res.end(result);
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
	else {
		var filename = './files' + req.url;
		if (filename.indexOf('..') > -1) return404(res);
		else if (filename.lastIndexOf('.') == 0) {
			if (filename[filename.length - 1] == '/') {
				var tryfile = false;
				filename += 'index.html';
			}
			else {
				filename += '/index.html';
				var tryfile = true;
			}
			fs.readFile(filename, function(err, data) {
				if (err) {
					if (tryfile) {
						filename = filename.substr(0, filename.length - 11) + '.html';
						fs.readFile(filename, function(err, data) {
							if (err) return404(res);
							else {
								var extension = filename.substring(filename.lastIndexOf('.') + 1, filename.length);
								res.setHeader('content-type', mime.lookup(extension));
								res.end(data);
							}
						});
					}
					else return404(res);
				}
				else {
					var extension = filename.substring(filename.lastIndexOf('.') + 1, filename.length);
					res.setHeader('content-type', mime.lookup(extension));
					res.end(data);
				}
			});
		}
		else {
			fs.readFile(filename, function(err, data) {
				if (err) return404(res);
				else {
					var extension = filename.substring(filename.lastIndexOf('.') + 1, filename.length);
					res.setHeader('content-type', mime.lookup(extension));
					res.end(data);
				}
			});
		}
	}
}).listen(PORT);
console.log('Server listening on port ' + String(PORT) + '\n');