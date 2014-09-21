if ! type "xdg-open" > /dev/null; then
	open http://localhost:8080;
else
	xdg-open http://localhost:8080
fi
node nbt.js;