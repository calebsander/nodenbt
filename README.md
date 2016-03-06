nodenbt
=======
###An HTML interface for viewing NBT and MCA files
To run, open `index.html` and drag-and-drop a `.dat`, `.mcr`, or `.mca` file in. The code requires a number of newer ECMAScript features, so it may not work in older browsers. If you don't want to bother downloading this repository, I have hosted a web version at http://calebsander.com/nbt/.

Instructions:
- Click the icon in front of a Compound or List tag to see its children
- The editting functions are as follows:
  - Edit (pencil) - change the value of a numeric (Byte, Short, Int, Long, Float, Double, Int_Array, Byte_Array) or String field
  - Delete (red X) - get rid of a field of a Compound or List
  - Add (+) - add another field to a Compound or List
  - Rename (Aa) - change the name of a field of a Compound
  - Up/down (vertical arrows) - swap an element in a List with the one preceding or following it
  - Coerce (circular arrows) - convert between numeric and String fields (or Lists of those types); also used to assign a type to a List with no type set
- Use the escape key in any input field or the editor to cancel the action
- When you have finished editting the file, click `Download`. It is usually almost immediate for NBT files, but it can be a lot longer for MCA files (especially if you open a lot of the chunks).
