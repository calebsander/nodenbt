const decoder = new TextDecoder();
const encoder = new TextEncoder();

function Buffer(arrayBuffer) {
	this.buffer = new DataView(arrayBuffer);
	this.length = arrayBuffer.byteLength;
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
Buffer.prototype.readUInt32BE = function(offset) {
	return this.buffer.getUint32(offset);
}
Buffer.prototype.readFloatBE = function(offset) {
	return this.buffer.getFloat32(offset);
}
Buffer.prototype.readDoubleBE = function(offset) {
	return this.buffer.getFloat64(offset);
}
Buffer.prototype.toString = function(encoding, start, end) { //encoding is disregarded
	return decoder.decode(this.buffer.buffer.slice(start, end));
}