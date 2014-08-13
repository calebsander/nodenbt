var fs = require('fs');
var zlib = require('zlib');
var util = require('util');
var bn = require('./BigNumber.js');
var http = require('http');
var mime = require('mime');

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

var nbt, nbtobject;
function processdat(filebuffer, res) {
	zlib.gunzip(filebuffer, function(err, result) {
		if (err) {
			nbt = Buffer.concat([filebuffer, new Buffer([0x00])]);
			try {
				console.log(util.inspect(nbtobject = readCompound(0), false, null));
				res.end(JSON.stringify({success: true, gzip: false}));
			}
			catch (error) {
				console.log(error);
				res.end(JSON.stringify({success: false, message: 'not dat or gzip'}));
			}
		}
		else {
			nbt = Buffer.concat([result, new Buffer([0x00])]);
			try {
				res.end(JSON.stringify({success: true, gzip: true}));
				console.log(util.inspect(nbtobject = readCompound(0), false, null));
			}
			catch (error) {
				console.log(error);
				res.end(JSON.stringify({success: false, message: 'parse failed'}));
			}
		}
	});
}

function readEnd(offset) {
	return {
		value: null,
		length: 0
	};
}

function readByte(offset) {
	return {
		value: nbt.readInt8(offset),
		length: 1
	};
}

function readShort(offset) {
	return {
		value: nbt.readInt16BE(offset),
		length: 2
	};
}

function readInt(offset) {
	return {
		value: nbt.readInt32BE(offset),
		length: 4
	};
}

function readLong(offset) {
	return {
		value: String(new bn(nbt.readInt32BE(offset)).multiply(4294967296).add(nbt.readInt32BE(offset + 4))),
		length: 8
	};
}

function readFloat(offset) {
	return {
		value: nbt.readFloatBE(offset),
		length: 4
	};
}

function readDouble(offset) {
	return {
		value: nbt.readDoubleBE(offset),
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
	var resultString = nbt.toString('utf8', offset, offset + bytesshort.value);
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
		Compound[readName.value] = {
			type: readType,
			value: readValue.value
		};
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

function return404(response) {
  fs.readFile('404.html', function (err, data) {
    response.statusCode = 404;
    response.setHeader('content-type', 'text/html');
    if (!err) response.write(data, 'utf8');
    response.end();
  });
}

http.createServer(function(req, res) {
	if (req.url == '/nbtjson') {
		res.setHeader('content-type', 'application/json');
		res.end(JSON.stringify(nbtobject));
	}
	else if (req.url.substr(0, 7) == '/setnbt') {
		var data = '';
		req.on('data', function(chunk) {
			data += chunk;
			if (data.length > 1000000) {
				res.setHeader('content-type', 'application/json');
				res.end(JSON.stringify({success: false, message: 'data overload'}));
			}
		}).on('end', function() {
			var success = false;
			data = JSON.parse(data);
			var paths = data.address.split('.');
			var nbtcopy = nbtobject;
			for (var i = 0; i < paths.length; i++) nbtcopy = nbtcopy.value[paths[i]];
			if (nbtcopy.type == 'TAG_Compound') {
				if (data.operation == 'addkey') {
					nbtcopy.value[data.key] = {
						type: data.type,
						value: data.value
					};
					success = true;
				}
				if (data.operation == 'delete') {
					delete nbtcopy.value[nbtcopy.key];
					success = true;
				}
			}
			else if (nbtcopy.type == 'TAG_List') {
				if (data.operation == 'addelements') {
					if (data.index) nbtcopy.value.splice.apply([data.index, 0].concat(data.elements));
					else nbtcpoy.value.splice.aply([nbtcopy.value.length - 1, 0].concat(data.elements));
					success = true;
				}
				if (data.operation == 'setelements') {
					for (i = 0; i < data.elements.length; i++) nbtcopy.value[data.index + i] = data.elements[i];
					success = true;
				}
			}
			else {
				if (data.operation == 'set') {
					nbtcopy.value = data.value;
					success = true;
				}
			}
		});
	}
	else if (req.url == '/upload') {
		var data = new Buffer(0);
		req.on('data', function(chunk) {
			data = Buffer.concat([data, chunk]);
			if (data.length > 10000000) {
				res.setHeader('content-type', 'application/json');
				res.end(JSON.stringify({success: false, message: 'data overload'}));
			}
		}).on('end', function() {
			res.setHeader('content-type', 'application/json');
			processdat(data, res);
		});
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
	              var extension = filename.substr(filename.lastIndexOf('.') + 1, filename.length);
	              res.setHeader('content-type', mime[extension]);
	              res.end(data);
	            }
	          });
	        }
	        else return404(res);
	      }
	      else {
	        var extension = filename.substr(filename.lastIndexOf('.') + 1, filename.length);
	        res.setHeader('content-type', mime[extension]);
	        res.end(data);
	      }
	    });
	  }
	  else {
	    fs.readFile(filename, function(err, data) {
	      if (err) return404(res);
	      else {
	        var extension = filename.substr(filename.lastIndexOf('.') + 1, filename.length);
	        res.setHeader('content-type', mime[extension]);
	        res.end(data);
	      }
	    });
	  }
	}
}).listen(8080);