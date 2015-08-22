//Strings for tag types are stored in variables of the same name so arbitrary string literals are not used
const TAG_End = 'TAG_End';
const TAG_Byte = 'TAG_Byte';
const TAG_Short = 'TAG_Short';
const TAG_Int = 'TAG_Int';
const TAG_Long = 'TAG_Long';
const TAG_Float = 'TAG_Float';
const TAG_Double = 'TAG_Double';
const TAG_Byte_Array = 'TAG_Byte_Array';
const TAG_String = 'TAG_String';
const TAG_List = 'TAG_List';
const TAG_Compound = 'TAG_Compound';
const TAG_Int_Array = 'TAG_Int_Array';

const images = { //stores the URL for all image assets
	'null': '/images/TAG_End.png',
	'TAG_Byte': '/images/TAG_Byte.png',
	'TAG_Short': '/images/TAG_Short.png',
	'TAG_Int': '/images/TAG_Int.png',
	'TAG_Long': '/images/TAG_Long.png',
	'TAG_Float': '/images/TAG_Float.png',
	'TAG_Double': '/images/TAG_Double.png',
	'TAG_Byte_Array': '/images/TAG_Byte_Array.png',
	'TAG_String': '/images/TAG_String.png',
	'TAG_List': '/images/TAG_List.png',
	'TAG_Compound': '/images/TAG_Compound.png',
	'TAG_Int_Array': '/images/TAG_Int_Array.png',
	'edit': '/images/edit.png',
	'delete': '/images/delete.png',
	'rename': '/images/rename.png',
	'add': '/images/add.png',
	'coerce': '/images/coerce.png',
	'up': '/images/up.png',
	'down': '/images/down.png',
	'chunk': '/images/chunk.png'
};

const coerceto = { //stores possible new tag types for conversion (not all may actually work)
	//null is a special case because it should only be used on lists of length 0 without a specified type
	'null': [TAG_Byte, TAG_Short, TAG_Int, TAG_Long, TAG_Float, TAG_Double, TAG_Byte_Array, TAG_String, TAG_List, TAG_Compound, TAG_Int_Array],
	'TAG_Byte': [TAG_Short, TAG_Int, TAG_Long, TAG_Float, TAG_Double, TAG_String],
	'TAG_Short': [TAG_Byte, TAG_Int, TAG_Long, TAG_Float, TAG_Double, TAG_String],
	'TAG_Int': [TAG_Byte, TAG_Short, TAG_Long, TAG_Float, TAG_Double, TAG_String],
	'TAG_Long': [TAG_Byte, TAG_Short, TAG_Int, TAG_Float, TAG_Double, TAG_String],
	'TAG_Float': [TAG_Byte, TAG_Short, TAG_Int, TAG_Long, TAG_Double, TAG_String],
	'TAG_Double': [TAG_Byte, TAG_Short, TAG_Int, TAG_Long, TAG_Float, TAG_String],
	'TAG_String': [TAG_Byte, TAG_Short, TAG_Int, TAG_Long, TAG_Float, TAG_Double],
	'TAG_Byte_Array': [TAG_Int_Array],
	'TAG_Int_Array': [TAG_Byte_Array]
};

const defaults = { //the values to initialize new elements at
	'TAG_Byte':       0,
	'TAG_Short':      0,
	'TAG_Int':        0,
	'TAG_Long':      '0',
	'TAG_Float':      0,
	'TAG_Double':     0,
	'TAG_Byte_Array': [],
	'TAG_String':     '',
	'TAG_List':       {
		'type': null,
		'list': []
	},
	'TAG_Compound':   {},
	'TAG_Int_Array':  []
};

//Constants for keypress codes
const ENTER_KEY = 13;
const ESC_KEY = 27;