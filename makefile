src:
	mkdir -p src/deps
	npm install
	cp node_modules/@forecasting/aggregation/index.js src/deps/aggregation.js
	cp node_modules/@forecasting/laplace/index.js src/deps/laplace.js
	rm -r node_modules

server:
	# pkill -f "python3 -m http.server" || true
	cd src && python3 -m http.server 8000
	cd ..

chmod:
	chmod 755 -R . # required by nginx
