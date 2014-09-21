if ! type "xdg-open" > /dev/null; then
	open http://localhost:8080
else
	xdg-open http://localhost:8080
fi
if type "node" > /dev/null; then
	node nbt.js
else
	nodejs nbt.js
fi 
