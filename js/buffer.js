//Interface is a subset of the NodeJS Buffer interface with sufficient functionality for NBT and MCA read/write operations
//Since the libraries were originally written using NodeJS, this allowed them to be used in normal JavaScript with minimal changes
function Buffer(arrayBuffer) {
	if (!(arrayBuffer instanceof ArrayBuffer)) arrayBuffer = new ArrayBuffer(arrayBuffer);
	this.buffer = new DataView(arrayBuffer);
	Object.defineProperty(this, 'length', {'value': this.buffer.byteLength, 'writable': false});
}
Buffer.prototype.readInt8 = function(offset) {
	return this.buffer.getInt8(offset);
}
Buffer.prototype.readInt16BE = function(offset) {
	return this.buffer.getInt16(offset);
}
Buffer.prototype.readInt32BE = function(offset) {
	return this.buffer.getInt32(offset);
}
Buffer.prototype.readUInt8 = function(offset) {
	return this.buffer.getUint8(offset);
}
Buffer.prototype.readUInt16BE = function(offset) {
	return this.buffer.getUint16(offset);
}
Buffer.prototype.readUInt32BE = function(offset) {
	return this.buffer.getUint32(offset);
}
Buffer.prototype.readFloatBE = function(offset) {
	return this.buffer.getFloat32(offset);
}
Buffer.prototype.readDoubleBE = function(offset) {
	return this.buffer.getFloat64(offset);
}
Buffer.prototype.toString = function(encoding, start, end) { //encoding is disregarded, assumed to be 'UTF-8'
	return decodeURIComponent(escape(String.fromCharCode.apply(null, new Uint8Array(this.rawBuffer().slice(start, end)))));
}
Buffer.prototype.writeInt8 = function(value, offset) {
	this.buffer.setInt8(offset, value);
}
Buffer.prototype.writeInt16BE = function(value, offset) {
	this.buffer.setInt16(offset, value);
}
Buffer.prototype.writeInt32BE = function(value, offset) {
	this.buffer.setInt32(offset, value);
}
Buffer.prototype.writeUInt8 = function(value, offset) {
	this.buffer.setUint8(offset, value);
}
Buffer.prototype.writeUInt16BE = function(value, offset) {
	this.buffer.setUint16(offset, value);
}
Buffer.prototype.writeUInt32BE = function(value, offset) {
	this.buffer.setUint32(offset, value);
}
Buffer.prototype.writeFloatBE = function(value, offset) {
	this.buffer.setFloat32(offset, value);
}
Buffer.prototype.writeDoubleBE = function(value, offset) {
	this.buffer.setFloat64(offset, value);
}
Buffer.prototype.write = function(string, offset) {
	const ascii = unescape(encodeURIComponent(string));
	for (var i = 0; i < ascii.length; i++) this.buffer.setUint8(offset + i, ascii.charCodeAt(i));
}
Buffer.prototype.fill = function(fillByte, start) {
	if (start === undefined) start = 0;
	new Uint8Array(this.rawBuffer()).fill(fillByte, start);
}
Buffer.prototype.copy = function(target, targetStart) {
	new Uint8Array(target.rawBuffer()).set(new Uint8Array(this.rawBuffer()), targetStart);
}
Buffer.prototype.slice = function(start, end) {
	return new Buffer(this.rawBuffer().slice(start, end));
}
Buffer.prototype.rawBuffer = function() {
	return this.buffer.buffer;
}
Buffer.concat = function(bufferArray) {
	var totalLength = 0;
	for (var sub in bufferArray) totalLength += bufferArray[sub].rawBuffer().byteLength;
	const newBuffer = new Buffer(new Uint8Array(totalLength).buffer);
	var currentIndex = 0;
	for (var sub in bufferArray) {
		bufferArray[sub].copy(newBuffer, currentIndex);
		currentIndex += bufferArray[sub].rawBuffer().byteLength;
	}
	return newBuffer;
}