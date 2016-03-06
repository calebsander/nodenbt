/*
	JAVASCRIPT OBJECT REPRESENTATION OF NBT DATA

	VALUE FORMATS
		nbtConstants.TAG_Byte: integer between -128 and 127 inclusive
		nbtConstants.TAG_Short: integer between -32768 and 32767 inclusive
		nbtConstants.TAG_Int: integer between -2147483648 and 2147483647 inclusive
		nbtConstants.TAG_Long: string representation of an integer between -9223372036854775808 and 9223372036854775807 inclusive
			The number must be stored as a string because JavaScript is only capable of storing 53-bit integers
		nbtConstants.TAG_Flaot: floating point number
		nbtConstants.TAG_Double: double-precision floating point number
		nbtConstants.TAG_Byte_Array: array of nbtConstants.TAG_Byte values
		nbtConstants.TAG_String: string
		nbtConstants.TAG_List: object with the following keys:
			{
				"type": string representation of tag type (e.g. "nbtConstants.TAG_Double"),
				"list": array of values of the specified type
			}
		nbtConstants.TAG_Compound: object where each key is the name of a tag contained in the compound and its value has the following format:
			{
				"type": string representation of tag type (e.g. "nbtConstants.TAG_Double"),
				"value": value of the specified type
			}
		nbtConstants.TAG_Int_Array: array of nbtConstants.TAG_Int values

	DESIGN
		The library consists of two parts: read functions and write functions.
		READ
			An instance of the NBTRead class is constructed around the Buffer being read from.
			There is a read fuction for each tag type's payload with the following functionality:
				-It is passed a position in the Buffer to start reading at
				-It returns an object with two keys:
					{
						"value": the value that was read,
						"length": the number of bytes long that the tag was
					}
			The read functions for the more complicated types make use of the simpler read functions.
		WRITE
			An instance of the Write class is constructed around the Buffer being written to.
			There is a write function for each tag type's payload with the following functionality:
				-It is passed a value to write
				-The value is written onto the end of the Buffer
			writeCompound can be passed one additional field, omitEnd:
				If this field is set to true, the nbtConstants.TAG_End byte won't be written at the end.
				This should only be used if the nbtConstants.TAG_Compound is the root-level one, such that the end is implied by the end of the Buffer.

	USAGE
	The read functions allow for reading any tag's value at any specified position in the Buffer.
	This may be useful for specific applications, but it is probably easiest simply to use readComplete().
	Similarly, it is possible to write any tag's payload onto the end of the write Buffer, but using writeComplete() is recommended.
	The value that readComplete() returns and writeComplete() expects is a value from a name-value pair of a nbtConstants.TAG_Compound's value.
*/

//NBT tag ID constants
const nbtConstants = {
	TAG_End: 0x00,
	TAG_Byte: 0x01,
	TAG_Short: 0x02,
	TAG_Int: 0x03,
	TAG_Long: 0x04,
	TAG_Float: 0x05,
	TAG_Double: 0x06,
	TAG_Byte_Array: 0x07,
	TAG_String: 0x08,
	TAG_List: 0x09,
	TAG_Compound: 0x0A,
	TAG_Int_Array: 0x0B
};

const longUpperShift = '4294967296'; //stores the value needed to multiply an integer to shift it left 32 bits - for long math

function NBTRead(buffer) {
	this.buffer = buffer;
}
//Process the entire Buffer into an object
NBTRead.prototype.readComplete = function() {
	return this.readCompound(0).value['']; //get past the empty base tag
};
//READ NBT - read a certain tag's payload at a certain offset in the Buffer
//each function returns the read value and its length so the offset can be changed accordingly
NBTRead.prototype.readByte = function(offset) {
	return {
		'value': this.buffer.readInt8(offset),
		'length': 1
	};
};
NBTRead.prototype.readShort = function(offset) {
	return {
		'value': this.buffer.readInt16BE(offset),
		'length': 2
	};
};
NBTRead.prototype.readInt = function(offset) {
	return {
		'value': this.buffer.readInt32BE(offset),
		'length': 4
	};
};
NBTRead.prototype.readLong = function(offset) {
	var upperint = this.readInt(offset);
	offset += upperint.length;
	return {
		'value': String(strnum.add(strnum.mul(String(upperint.value), longUpperShift), String(this.buffer.readUInt32BE(offset)))), //JavaScript can't natively store 64-bit integers, so they are stored in a base-10 string representation
		'length': 8
	};
};
NBTRead.prototype.readFloat = function(offset) {
	return {
		'value': this.buffer.readFloatBE(offset),
		'length': 4
	};
};
NBTRead.prototype.readDouble = function(offset) {
	return {
		'value': this.buffer.readDoubleBE(offset),
		'length': 8
	};
};
NBTRead.prototype.readByte_Array = function(offset) {
	var originaloffset = offset;
	var sizeint = this.readInt(offset); //read the length of the array
	offset += sizeint.length;

	var Byte_Array = [];
	var element;
	for (var i = 0; i < sizeint.value; i++) { //read each element and add it to the array
		element = this.readByte(offset);
		Byte_Array[i] = element.value;
		offset += element.length;
	}

	return {
		'value': Byte_Array,
		'length': offset - originaloffset
	};
};
NBTRead.prototype.readString = function(offset) {
	var originaloffset = offset;
	var bytesshort = this.readShort(offset); //read the length of the string
	offset += bytesshort.length;
	var resultString = this.buffer.toString('utf8', offset, offset + bytesshort.value);
	offset += bytesshort.value;
	return {
		'value': resultString,
		'length': offset - originaloffset
	};
};
NBTRead.prototype.readList = function(offset) {
	var originaloffset = offset;
	var readFunction, readType;

	var typebyte = this.readByte(offset);
	offset += typebyte.length;
	var typeInfo = this.extractType(typebyte);

	var sizeint = this.readInt(offset); //read the length of the list
	offset += sizeint.length;

	var List = [];
	var element;
	for (var i = 0; i < sizeint.value; i++) { //reach each element and add it to the list
		element = this[getReadFunctionName(typeInfo)](offset);
		List[i] = element.value;
		offset += element.length;
	}

	return {
		'value': {
			'type': typeInfo,
			'list': List
		},
		'length': offset - originaloffset
	};
};
NBTRead.prototype.readTypeByte = function(offset) { //reads a byte, but returns TAG_End if past the end of the buffer (since it isn't required at the end of NBT data)
	if (offset == this.buffer.length) {
		return {
			'value': nbtConstants.TAG_End,
			'length': 1
		};
	}
	else return this.readByte(offset);
}
NBTRead.prototype.readCompound = function(offset) {
	var originaloffset = offset;
	var readName, //name of the read tag
		typeInfo, //type name and read function
		readValue; //value read into the tag
	var Compound = {};

	var typebyte = this.readTypeByte(offset); //read the first byte before the loop in case it is an End tag
	offset += typebyte.length;
	while (typebyte.value != nbtConstants.TAG_End) { //keep reading until finding an End tag
		readName = this.readString(offset);
		offset += readName.length;
		typeInfo = this.extractType(typebyte);
		readValue = this[getReadFunctionName(typeInfo)](offset);
		if (Compound[readName.value]) throw new Error('Tag ' + readName.value + ' already exists');
		else {
			Compound[readName.value] = {
				'type': typeInfo,
				'value': readValue.value
			};
		}
		offset += readValue.length;

		typebyte = this.readTypeByte(offset);
		offset += typebyte.length;
	}

	return {
		'value': Compound,
		'length': offset - originaloffset
	};
};
NBTRead.prototype.readInt_Array = function(offset) { //see readByte_Array
	var originaloffset = offset;
	var sizeint = this.readInt(offset);
	offset += sizeint.length;

	var IntArray = [];
	var element;
	for (var i = 0; i < sizeint.value; i++) {
		element = this.readInt(offset);
		IntArray[i] = element.value;
		offset += element.length;
	}

	return {
		'value': IntArray,
		'length': offset - originaloffset
	};
};
//Select (string) type of tag by the tag ID
NBTRead.prototype.extractType = function(typebyte) {
	switch (typebyte.value) { //choose which read function to use based on the type of element
		case nbtConstants.TAG_End: //should never be read
			return null;
		case nbtConstants.TAG_Byte:
			return 'TAG_Byte';
		case nbtConstants.TAG_Short:
			return 'TAG_Short';
		case nbtConstants.TAG_Int:
			return 'TAG_Int';
		case nbtConstants.TAG_Long:
			return 'TAG_Long';
		case nbtConstants.TAG_Float:
			return 'TAG_Float';
		case nbtConstants.TAG_Double:
			return 'TAG_Double';
		case nbtConstants.TAG_Byte_Array:
			return 'TAG_Byte_Array';
		case nbtConstants.TAG_String:
			return 'TAG_String';
		case nbtConstants.TAG_List:
			return 'TAG_List';
		case nbtConstants.TAG_Compound:
			return 'TAG_Compound';
		case nbtConstants.TAG_Int_Array:
			return 'TAG_Int_Array';
		default:
			throw new Error('No such tag: ' + String(typebyte.value));
	}
};

function NBTWrite() {
	this.buffer = new Buffer(0);
}
//Process an entire object into a buffer
NBTWrite.prototype.writeComplete = function(value) {
	this.writeCompound({'': value}, true); //readd empty base tag
};
//WRITE NBT - write a certain tag's payload to the end of the Buffer
//There is no need to keep track of the offset (unlike in the read functions) because the offset is always the length of the buffer
NBTWrite.prototype.writeByte = function(value) {
	if (value < -128 || value > 127) throw new Error('out of range: ' + String(value));
	var bytebuffer = new Buffer(1);
	bytebuffer.writeInt8(value, 0);
	this.buffer = Buffer.concat([this.buffer, bytebuffer]);
};
NBTWrite.prototype.writeShort = function(value) {
	if (value < -32768 || value > 32767) throw new Error('out of range: ' + String(value));
	var shortbuffer = new Buffer(2);
	shortbuffer.writeInt16BE(value, 0);
	this.buffer = Buffer.concat([this.buffer, shortbuffer]);
};
NBTWrite.prototype.writeInt = function(value) {
	if (value < -2147483648 || value > 2147483647) throw new Error('out of range: ' + String(value));
	var intbuffer = new Buffer(4);
	intbuffer.writeInt32BE(value, 0);
	this.buffer = Buffer.concat([this.buffer, intbuffer]);
};
NBTWrite.prototype.writeLong = function(value) {
	if (strnum.gt(value, '9223372036854775807') || strnum.lt(value, '-9223372036854775808')) throw new Error('out of range: ' + value);
	var bnb = strnum.div(value, longUpperShift, true); //get upper signed int
	var bnl = strnum.sub(value, strnum.mul(bnb, longUpperShift)); //get lower unsigned int
	if (strnum.gt(bnl, '2147483647')) bnl = strnum.sub(bnl, longUpperShift); //make lower int fit in a signed int
	this.writeInt(Number(bnb));
	this.writeInt(Number(bnl));
};
NBTWrite.prototype.writeFloat = function(value) {
	var floatbuffer = new Buffer(4);
	floatbuffer.writeFloatBE(value, 0);
	this.buffer = Buffer.concat([this.buffer, floatbuffer]);
};
NBTWrite.prototype.writeDouble = function(value) {
	var doublebuffer = new Buffer(8);
	doublebuffer.writeDoubleBE(value, 0);
	this.buffer = Buffer.concat([this.buffer, doublebuffer]);
};
NBTWrite.prototype.writeByte_Array = function(value) {
	this.writeInt(value.length);
	for (var i = 0; i < value.length; i++) this.writeByte(value[i]);
};
NBTWrite.prototype.writeString = function(value) {
	this.writeShort(value.length);
	var stringbuffer = new Buffer(value.length);
	stringbuffer.write(value, 0);
	this.buffer = Buffer.concat([this.buffer, stringbuffer]);
};
NBTWrite.prototype.writeList = function(value) {
	this.writeByte(this.computeType(value.type));
	this.writeInt(value.list.length);
	for (var i = 0; i < value.list.length; i++) this[getWriteFunctionName(value.type)](value.list[i]);
};
NBTWrite.prototype.writeCompound = function(value, omitEnd) {
	for (var i in value) {
		this.writeByte(this.computeType(value[i].type));
		this.writeString(i);
		this[getWriteFunctionName(value[i].type)](value[i].value);
	}
	if (!omitEnd) this.writeByte(nbtConstants.TAG_End);
};
NBTWrite.prototype.writeInt_Array = function(value) {
	this.writeInt(value.length);
	for (var i = 0; i < value.length; i++) this.writeInt(value[i]);
};
//The opposite of extractType; returns the TAG id necessary to write the tag
NBTWrite.prototype.computeType = function(typeName) {
	switch (typeName) {
		case null: //should never be written
			return nbtConstants.TAG_End;
		case 'TAG_Byte':
			return nbtConstants.TAG_Byte;
		case 'TAG_Short':
			return nbtConstants.TAG_Short;
		case 'TAG_Int':
			return nbtConstants.TAG_Int;
		case 'TAG_Long':
			return nbtConstants.TAG_Long;
		case 'TAG_Float':
			return nbtConstants.TAG_Float;
		case 'TAG_Double':
			return nbtConstants.TAG_Double;
		case 'TAG_Byte_Array':
			return nbtConstants.TAG_Byte_Array;
		case 'TAG_String':
			return nbtConstants.TAG_String;
		case 'TAG_List':
			return nbtConstants.TAG_List;
		case 'TAG_Compound':
			return nbtConstants.TAG_Compound;
		case 'TAG_Int_Array':
			return nbtConstants.TAG_Int_Array;
		default:
			throw new Error('No such tag: ' + value.type);
	}
};
NBTWrite.prototype.getBuffer = function() {
	return this.buffer;
};

function getFunctionName(prefix, type) {
	return prefix + type.substring('TAG_'.length, type.length);
}
function getReadFunctionName(type) {
	return getFunctionName('read', type);
}
function getWriteFunctionName(type) {
	return getFunctionName('write', type);
}