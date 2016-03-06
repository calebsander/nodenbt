//Will alert a user if they are missing the necessary ECMAScript classes to run the program
const classesNeeded = ['DataView', 'ArrayBuffer', 'Uint8Array', 'TextEncoder', 'TextDecoder'];
var missingClasses = [];
for (var className in classesNeeded) {
	if (!(classesNeeded[className] in window)) missingClasses.push(classesNeeded[className]);
}
if (missingClasses.length) alert('Not supported in your browser. Misssing dependencies: ' + missingClasses.join());